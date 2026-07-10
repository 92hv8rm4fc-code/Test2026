import json
import time
import urllib.request
from pathlib import Path


BASE_URL = "https://pokeapi.co/api/v2/pokemon"
OFFICIAL_DEX_MAX = 1025
PAGE_SIZE = 100
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "pokemon-index.json"
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def get_pokemon_id(url):
    parts = [part for part in url.rstrip("/").split("/") if part]
    try:
        return int(parts[-1])
    except ValueError:
        return None


def main():
    results = []
    offset = 0

    while offset < OFFICIAL_DEX_MAX:
        limit = min(PAGE_SIZE, OFFICIAL_DEX_MAX - offset)
        url = f"{BASE_URL}?limit={limit}&offset={offset}"
        for attempt in range(1, 4):
            try:
                request = urllib.request.Request(
                    url,
                    headers={"User-Agent": "pokemon-binder-pokedex/0.1"},
                )
                with OPENER.open(request, timeout=60) as response:
                    payload = json.load(response)
                break
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(attempt)

        results.extend(payload.get("results", []))
        print(f"downloaded {min(len(results), OFFICIAL_DEX_MAX)} / {OFFICIAL_DEX_MAX}", flush=True)

        if offset + limit >= OFFICIAL_DEX_MAX:
            break

        offset += limit
        time.sleep(0.15)

    index = []
    for entry in results:
        pokemon_id = get_pokemon_id(entry["url"])
        if pokemon_id is None or pokemon_id < 1 or pokemon_id > OFFICIAL_DEX_MAX:
            continue
        index.append(
            {
                "id": pokemon_id,
                "name": entry["name"],
                "url": entry["url"],
            }
        )

    index.sort(key=lambda item: item["id"])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(index)} pokemon to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
