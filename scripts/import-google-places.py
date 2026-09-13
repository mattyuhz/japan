#!/usr/bin/env python3
"""Create a public-safe Japan venue index from a Google Takeout Maps archive.

Only venue title, source-list category, Maps URL, and decoded public-place
coordinates are retained. Notes, comments, reviews, and non-Japan entries are
never written to the output.
"""

import csv
import io
import json
import math
import re
import sys
import zipfile
from pathlib import Path

from s2sphere import CellId


PLACE_ID = re.compile(r"!1s0x([0-9a-f]+):0x([0-9a-f]+)", re.I)


def in_japan(lat: float, lng: float) -> bool:
    boxes = (
        (41.2, 45.8, 139.0, 146.1),  # Hokkaido
        (33.3, 41.7, 130.6, 142.3),  # Honshu
        (32.6, 34.7, 131.8, 135.0),  # Shikoku
        (30.7, 34.3, 129.2, 132.3),  # Kyushu
        (24.0, 31.0, 122.7, 131.6),  # Okinawa / Ryukyu
        (20.0, 33.4, 136.0, 154.0),  # Izu / Ogasawara islands
    )
    return any(a <= lat <= b and c <= lng <= d for a, b, c, d in boxes)


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def area_for(lat: float, lng: float) -> str:
    destinations = (
        ("Kamakura", 35.3192, 139.5467, 18),
        ("Tokyo", 35.6762, 139.6503, 48),
        ("Kyoto", 35.0116, 135.7681, 35),
        ("Osaka", 34.6937, 135.5023, 38),
    )
    for name, dlat, dlng, radius in destinations:
        if distance_km(lat, lng, dlat, dlng) <= radius:
            return name
    return "Elsewhere"


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: import-google-places.py TAKEOUT.zip OUTPUT.json")
    archive, output = Path(sys.argv[1]), Path(sys.argv[2])
    places: dict[str, dict] = {}
    with zipfile.ZipFile(archive) as bundle:
        files = [name for name in bundle.namelist() if name.startswith("Saved/") and name.endswith(".csv")]
        for filename in files:
            category = Path(filename).stem
            rows = csv.DictReader(io.StringIO(bundle.read(filename).decode("utf-8-sig", errors="replace")))
            for row in rows:
                title, url = (row.get("Title") or "").strip(), (row.get("URL") or "").strip()
                match = PLACE_ID.search(url)
                if not title or not match:
                    continue
                cell_hex, feature_hex = match.groups()
                point = CellId(int(cell_hex, 16)).to_lat_lng()
                lat, lng = point.lat().degrees, point.lng().degrees
                if not in_japan(lat, lng):
                    continue
                key = f"{cell_hex.lower()}:{feature_hex.lower()}"
                place = places.setdefault(key, {
                    "title": title,
                    "url": url,
                    "area": area_for(lat, lng),
                    "categories": [],
                })
                if category not in place["categories"]:
                    place["categories"].append(category)

    clean = sorted(places.values(), key=lambda item: (item["area"], item["title"].casefold()))
    for place in clean:
        place["categories"].sort(key=str.casefold)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(clean, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Wrote {len(clean)} sanitized Japan venues to {output}")


if __name__ == "__main__":
    main()
