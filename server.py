import json
import re
import sqlite3
import urllib.request
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DETAILS_DIR = DATA_DIR / "pokemon-details"
EVOLUTION_DIR = DATA_DIR / "evolution-chains"
SPRITES_DIR = DATA_DIR / "sprites"
DB_PATH = DATA_DIR / "pokedex.sqlite"
INDEX_PATH = DATA_DIR / "pokemon-index.json"
OFFICIAL_DEX_MAX = 1025
POKEAPI_HEADERS = {"User-Agent": "pokemon-binder-pokedex/0.1"}
SPECIES_ID_PATTERN = re.compile(r"/pokemon-species/(\d+)/")


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS collection (
                pokemon_id INTEGER PRIMARY KEY,
                pokemon_json TEXT NOT NULL,
                added_at TEXT NOT NULL
            )
            """
        )


def load_index():
    with INDEX_PATH.open(encoding="utf-8") as file:
        return json.load(file)


def pokemon_id_from_query(query):
    query = query.strip().lower()
    if query.isdigit():
        pokemon_id = int(query)
        return pokemon_id if 1 <= pokemon_id <= OFFICIAL_DEX_MAX else None

    for entry in load_index():
        if entry["name"] == query:
            return entry["id"]

    return None


def local_sprite_path(pokemon_id):
    return f"./data/sprites/{pokemon_id}.png"


def apply_local_sprite(pokemon):
    if not pokemon or not pokemon.get("id"):
        return pokemon
    return {**pokemon, "sprite": local_sprite_path(pokemon["id"])}


def normalize_pokemon(data):
    return {
        "id": data["id"],
        "name": data["name"],
        "height": data["height"] / 10,
        "weight": data["weight"] / 10,
        "baseExperience": data.get("base_experience") or "n/a",
        "sprite": local_sprite_path(data["id"]),
        "types": [entry["type"]["name"] for entry in data.get("types", [])],
        "abilities": [entry["ability"]["name"] for entry in data.get("abilities", [])],
        "stats": [
            {"name": entry["stat"]["name"], "value": entry["base_stat"]}
            for entry in data.get("stats", [])
        ],
    }


def read_cached_pokemon(pokemon_id):
    path = DETAILS_DIR / f"{pokemon_id}.json"
    if not path.exists():
        return None
    return apply_local_sprite(json.loads(path.read_text(encoding="utf-8")))


def fetch_and_cache_pokemon(pokemon_id):
    request = urllib.request.Request(
        f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}",
        headers={"User-Agent": "pokemon-binder-pokedex/0.1"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        pokemon = normalize_pokemon(json.load(response))

    DETAILS_DIR.mkdir(parents=True, exist_ok=True)
    (DETAILS_DIR / f"{pokemon_id}.json").write_text(
        json.dumps(pokemon, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return pokemon


def get_pokemon(query):
    pokemon_id = pokemon_id_from_query(query)
    if pokemon_id is None:
        return None

    return read_cached_pokemon(pokemon_id) or fetch_and_cache_pokemon(pokemon_id)


def species_id_from_url(url):
    match = SPECIES_ID_PATTERN.search(url)
    return int(match.group(1)) if match else None


def flatten_evolution_chain(chain_node):
    entries = []

    def walk(node):
        species_id = species_id_from_url(node["species"]["url"])
        if species_id is None:
            return

        entries.append(
            {
                "id": species_id,
                "name": node["species"]["name"],
            }
        )

        for child in node.get("evolves_to", []):
            walk(child)

    walk(chain_node)
    return entries


def read_cached_evolution_chain(pokemon_id):
    path = EVOLUTION_DIR / f"{pokemon_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def fetch_and_cache_evolution_chain(pokemon_id):
    species_request = urllib.request.Request(
        f"https://pokeapi.co/api/v2/pokemon-species/{pokemon_id}",
        headers=POKEAPI_HEADERS,
    )
    with urllib.request.urlopen(species_request, timeout=45) as response:
        species_data = json.load(response)

    evolution_request = urllib.request.Request(
        species_data["evolution_chain"]["url"],
        headers=POKEAPI_HEADERS,
    )
    with urllib.request.urlopen(evolution_request, timeout=45) as response:
        chain_data = json.load(response)

    payload = {
        "currentId": pokemon_id,
        "chain": flatten_evolution_chain(chain_data["chain"]),
    }

    EVOLUTION_DIR.mkdir(parents=True, exist_ok=True)
    (EVOLUTION_DIR / f"{pokemon_id}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return payload


def get_evolution_chain(pokemon_id):
    cached = read_cached_evolution_chain(pokemon_id)
    if cached is not None:
        return cached

    return {"currentId": pokemon_id, "chain": []}


class PokedexHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/api/collection":
            self.send_json(self.get_collection())
            return

        if self.path.startswith("/api/pokemon/"):
            query = unquote(self.path.removeprefix("/api/pokemon/"))
            pokemon = get_pokemon(query)
            if pokemon is None:
                self.send_json({"error": "Pokemon not found"}, HTTPStatus.NOT_FOUND)
                return
            self.send_json(pokemon)
            return

        if self.path.startswith("/api/evolution/"):
            query = unquote(self.path.removeprefix("/api/evolution/"))
            pokemon_id = pokemon_id_from_query(query)
            if pokemon_id is None:
                self.send_json({"error": "Pokemon not found"}, HTTPStatus.NOT_FOUND)
                return

            try:
                self.send_json(get_evolution_chain(pokemon_id))
            except Exception:
                self.send_json(
                    {"error": "Failed to load evolution chain"},
                    HTTPStatus.BAD_GATEWAY,
                )
            return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/collection":
            payload = self.read_json()
            pokemon = payload.get("pokemon")
            if not pokemon or not pokemon.get("id"):
                self.send_json({"error": "Invalid pokemon payload"}, HTTPStatus.BAD_REQUEST)
                return

            pokemon = apply_local_sprite(pokemon)
            added_at = datetime.now(timezone.utc).isoformat()
            with sqlite3.connect(DB_PATH) as connection:
                connection.execute(
                    """
                    INSERT OR REPLACE INTO collection (pokemon_id, pokemon_json, added_at)
                    VALUES (?, ?, ?)
                    """,
                    (pokemon["id"], json.dumps(pokemon, ensure_ascii=False), added_at),
                )
            self.send_json({"ok": True})
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        if self.path == "/api/collection":
            with sqlite3.connect(DB_PATH) as connection:
                connection.execute("DELETE FROM collection")
            self.send_json({"ok": True})
            return

        if self.path.startswith("/api/collection/"):
            pokemon_id = int(unquote(self.path.removeprefix("/api/collection/")))
            with sqlite3.connect(DB_PATH) as connection:
                connection.execute("DELETE FROM collection WHERE pokemon_id = ?", (pokemon_id,))
            self.send_json({"ok": True})
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def get_collection(self):
        with sqlite3.connect(DB_PATH) as connection:
            rows = connection.execute(
                "SELECT pokemon_id, pokemon_json, added_at FROM collection ORDER BY pokemon_id"
            ).fetchall()

        return [
            {
                "key": str(pokemon_id),
                "pokemon": apply_local_sprite(json.loads(pokemon_json)),
                "addedAt": added_at,
            }
            for pokemon_id, pokemon_json, added_at in rows
        ]

    def read_json(self):
        length = int(self.headers.get("content-length", 0))
        return json.loads(self.rfile.read(length) or b"{}")

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    init_db()
    server = ThreadingHTTPServer(("127.0.0.1", 5173), PokedexHandler)
    print("Pokemon Binder Pokedex: http://127.0.0.1:5173")
    server.serve_forever()


if __name__ == "__main__":
    main()
