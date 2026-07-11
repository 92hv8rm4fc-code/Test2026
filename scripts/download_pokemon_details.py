import json
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "data" / "pokemon-index.json"
OUTPUT_DIR = ROOT / "data" / "pokemon-details"
GRAPHQL_URL = "https://beta.pokeapi.co/graphql/v1beta"
OFFICIAL_DEX_MAX = 1025
PAGE_SIZE = 10

QUERY = """
query OfficialPokemonDetails($limit: Int!, $offset: Int!) {
  pokemon_v2_pokemon(
    where: {id: {_lte: 1025}}
    order_by: {id: asc}
    limit: $limit
    offset: $offset
  ) {
    id
    name
    height
    weight
    base_experience
    pokemon_v2_pokemontypes {
      pokemon_v2_type {
        name
      }
    }
    pokemon_v2_pokemonabilities {
      pokemon_v2_ability {
        name
      }
    }
    pokemon_v2_pokemonstats {
      base_stat
      pokemon_v2_stat {
        name
      }
    }
  }
}
"""


def normalize_pokemon(data):
    return {
        "id": data["id"],
        "name": data["name"],
        "height": data["height"] / 10,
        "weight": data["weight"] / 10,
        "baseExperience": data.get("base_experience") or "n/a",
        "sprite": f"./data/sprites/{data['id']}.png",
        "types": [
            entry["pokemon_v2_type"]["name"]
            for entry in data.get("pokemon_v2_pokemontypes", [])
        ],
        "abilities": [
            entry["pokemon_v2_ability"]["name"]
            for entry in data.get("pokemon_v2_pokemonabilities", [])
        ],
        "stats": [
            {"name": entry["pokemon_v2_stat"]["name"], "value": entry["base_stat"]}
            for entry in data.get("pokemon_v2_pokemonstats", [])
        ],
    }


def fetch_graphql(limit, offset):
    payload = json.dumps(
        {
            "query": QUERY,
            "variables": {"limit": limit, "offset": offset},
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        GRAPHQL_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "pokemon-binder-pokedex/0.1",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    names_by_id = {entry["id"]: entry["name"] for entry in index}
    written = 0
    offset = 0

    while offset < OFFICIAL_DEX_MAX:
        limit = min(PAGE_SIZE, OFFICIAL_DEX_MAX - offset)
        for attempt in range(1, 4):
            try:
                payload = fetch_graphql(limit, offset)
                break
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(attempt)
        rows = payload["data"]["pokemon_v2_pokemon"]

        if not rows:
            break

        for row in rows:
            pokemon_id = row["id"]
            if pokemon_id < 1 or pokemon_id > OFFICIAL_DEX_MAX:
                continue

            pokemon = normalize_pokemon(row)
            output_path = OUTPUT_DIR / f"{pokemon_id}.json"
            output_path.write_text(
                json.dumps(pokemon, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            written += 1
            print(
                f"{written}/{OFFICIAL_DEX_MAX} cached #{pokemon_id} {names_by_id.get(pokemon_id, pokemon['name'])}",
                flush=True,
            )

        offset += limit


if __name__ == "__main__":
    main()
