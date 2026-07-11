import json
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "data" / "evolution-chains"
GRAPHQL_URL = "https://beta.pokeapi.co/graphql/v1beta"
OFFICIAL_DEX_MAX = 1025
PAGE_SIZE = 100
WORKERS = 8
SPECIES_ID_PATTERN = re.compile(r"/pokemon-species/(\d+)/")

SPECIES_QUERY = """
query SpeciesEvolutionChains($limit: Int!, $offset: Int!) {
  pokemon_v2_pokemonspecies(
    where: {id: {_lte: 1025}}
    order_by: {id: asc}
    limit: $limit
    offset: $offset
  ) {
    id
    name
    evolution_chain_id
  }
}
"""


def fetch_graphql(limit, offset):
    payload = json.dumps(
        {
            "query": SPECIES_QUERY,
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


def load_species_rows():
    rows = []
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

        batch = payload["data"]["pokemon_v2_pokemonspecies"]
        if not batch:
            break

        rows.extend(batch)
        offset += limit

    return [row for row in rows if 1 <= row["id"] <= OFFICIAL_DEX_MAX]


def flatten_evolution_chain(chain_node):
    entries = []

    def walk(node):
        match = SPECIES_ID_PATTERN.search(node["species"]["url"])
        if match is None:
            return

        entries.append(
            {
                "id": int(match.group(1)),
                "name": node["species"]["name"],
            }
        )

        for child in node.get("evolves_to", []):
            walk(child)

    walk(chain_node)
    return entries


def fetch_evolution_chain(chain_id):
    request = urllib.request.Request(
        f"https://pokeapi.co/api/v2/evolution-chain/{chain_id}",
        headers={"User-Agent": "pokemon-binder-pokedex/0.1"},
    )

    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                chain_data = json.load(response)
            return chain_id, flatten_evolution_chain(chain_data["chain"])
        except Exception:
            if attempt == 3:
                return chain_id, None
            time.sleep(attempt)

    return chain_id, None


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    species_rows = load_species_rows()
    chain_ids = sorted({row["evolution_chain_id"] for row in species_rows if row["evolution_chain_id"]})
    chains_by_id = {}
    failed_chain_ids = []

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {
            executor.submit(fetch_evolution_chain, chain_id): chain_id
            for chain_id in chain_ids
        }

        for index, future in enumerate(as_completed(futures), start=1):
            chain_id, chain = future.result()
            if chain is None:
                failed_chain_ids.append(chain_id)
            else:
                chains_by_id[chain_id] = chain

            if index % 25 == 0 or index == len(chain_ids):
                print(
                    f"{index}/{len(chain_ids)} chains fetched "
                    f"(cached: {len(chains_by_id)}, failed: {len(failed_chain_ids)})",
                    flush=True,
                )

    written = 0
    for row in species_rows:
        species_id = row["id"]
        chain = chains_by_id.get(row["evolution_chain_id"], [])
        payload = {
            "currentId": species_id,
            "chain": chain,
        }
        output_path = OUTPUT_DIR / f"{species_id}.json"
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        written += 1

        if written % 100 == 0 or written == len(species_rows):
            print(f"{written}/{len(species_rows)} species files written", flush=True)

    print(
        f"Done. species={written}, unique_chains={len(chains_by_id)}, "
        f"failed_chains={len(failed_chain_ids)}",
        flush=True,
    )

    if failed_chain_ids:
        preview = ", ".join(str(chain_id) for chain_id in failed_chain_ids[:20])
        print(f"Failed chain IDs: {preview}", flush=True)


if __name__ == "__main__":
    main()
