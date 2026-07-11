import json
import sqlite3
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
SPRITES_DIR = DATA_DIR / "sprites"
DETAILS_DIR = DATA_DIR / "pokemon-details"
DB_PATH = DATA_DIR / "pokedex.sqlite"
OFFICIAL_DEX_MAX = 1025
REMOTE_SPRITE_URL = (
    "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/"
    "sprites/pokemon/other/official-artwork/{pokemon_id}.png"
)
LOCAL_SPRITE_PATH = "./data/sprites/{pokemon_id}.png"
WORKERS = 8
MIN_FILE_SIZE = 512


def local_sprite_path(pokemon_id):
    return LOCAL_SPRITE_PATH.format(pokemon_id=pokemon_id)


def download_sprite(pokemon_id):
    output_path = SPRITES_DIR / f"{pokemon_id}.png"
    if output_path.exists() and output_path.stat().st_size >= MIN_FILE_SIZE:
        return pokemon_id, "skipped"

    url = REMOTE_SPRITE_URL.format(pokemon_id=pokemon_id)
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "pokemon-binder-pokedex/0.1"},
    )

    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                data = response.read()
            if len(data) < MIN_FILE_SIZE:
                raise RuntimeError(f"file too small ({len(data)} bytes)")
            output_path.write_bytes(data)
            return pokemon_id, "saved"
        except Exception:
            if attempt == 3:
                return pokemon_id, "failed"
            time.sleep(attempt)

    return pokemon_id, "failed"


def update_pokemon_details():
    updated = 0
    for pokemon_id in range(1, OFFICIAL_DEX_MAX + 1):
        path = DETAILS_DIR / f"{pokemon_id}.json"
        if not path.exists():
            continue

        pokemon = json.loads(path.read_text(encoding="utf-8"))
        sprite_path = local_sprite_path(pokemon_id)
        if pokemon.get("sprite") != sprite_path:
            pokemon["sprite"] = sprite_path
            path.write_text(json.dumps(pokemon, ensure_ascii=False, indent=2), encoding="utf-8")
            updated += 1

    return updated


def update_collection_sprites():
    if not DB_PATH.exists():
        return 0

    updated = 0
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            "SELECT pokemon_id, pokemon_json, added_at FROM collection"
        ).fetchall()

        for pokemon_id, pokemon_json, added_at in rows:
            pokemon = json.loads(pokemon_json)
            sprite_path = local_sprite_path(pokemon_id)
            if pokemon.get("sprite") == sprite_path:
                continue

            pokemon["sprite"] = sprite_path
            connection.execute(
                """
                UPDATE collection
                SET pokemon_json = ?
                WHERE pokemon_id = ?
                """,
                (json.dumps(pokemon, ensure_ascii=False), pokemon_id),
            )
            updated += 1

    return updated


def main():
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)
    saved = 0
    skipped = 0
    failed = []

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {
            executor.submit(download_sprite, pokemon_id): pokemon_id
            for pokemon_id in range(1, OFFICIAL_DEX_MAX + 1)
        }

        for index, future in enumerate(as_completed(futures), start=1):
            pokemon_id, status = future.result()
            if status == "saved":
                saved += 1
            elif status == "skipped":
                skipped += 1
            else:
                failed.append(pokemon_id)

            if index % 25 == 0 or index == OFFICIAL_DEX_MAX:
                print(
                    f"{index}/{OFFICIAL_DEX_MAX} processed "
                    f"(saved: {saved}, skipped: {skipped}, failed: {len(failed)})",
                    flush=True,
                )

    details_updated = update_pokemon_details()
    collection_updated = update_collection_sprites()

    print(
        f"Done. saved={saved}, skipped={skipped}, failed={len(failed)}, "
        f"details_updated={details_updated}, collection_updated={collection_updated}",
        flush=True,
    )

    if failed:
        print("Failed IDs:", ", ".join(str(pokemon_id) for pokemon_id in sorted(failed)[:20]), flush=True)
        if len(failed) > 20:
            print(f"... and {len(failed) - 20} more", flush=True)


if __name__ == "__main__":
    main()
