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
import unicodedata
import zipfile
from pathlib import Path

from s2sphere import CellId


PLACE_ID = re.compile(r"!1s0x([0-9a-f]+):0x([0-9a-f]+)", re.I)
CID = re.compile(r"[?&]cid=(\d+)")


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


NEIGHBORHOODS = json.loads((Path(__file__).resolve().parents[1] / "src/data/neighborhoods.json").read_text())

def folded(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", value.casefold()) if not unicodedata.combining(c))


def neighborhood_for(area: str, lat: float, lng: float, title: str) -> str:
    # Feature-ID cell centers are too unreliable for street-level assignment.
    # Use explicit locality names only; unmatched venues remain unassigned.
    text = folded(title)
    matches = []
    for neighborhood in NEIGHBORHOODS:
        if neighborhood["area"] != area:
            continue
        for alias in [neighborhood["name"], *neighborhood["aliases"]]:
            alias = folded(alias)
            pattern = re.escape(alias) if re.search(r"[\u3000-\u9fff]", alias) else r"(?<![a-z])" + re.escape(alias) + r"(?![a-z])"
            for match in re.finditer(pattern, text):
                matches.append((match.start(), match.end(), neighborhood["name"]))
    # More specific phrases override contained names (Yanaka Ginza, Nakameguro).
    matches = [m for m in matches if not any(other[0] <= m[0] and other[1] >= m[1] and other[1]-other[0] > m[1]-m[0] for other in matches)]
    # Branch names generally follow brand names: Kanda Tamagoken Ikebukuro.
    return max(matches, key=lambda m: (m[1], m[1]-m[0]))[2] if matches else "Neighborhood to confirm"


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: import-google-places.py TAKEOUT.zip OUTPUT.json")
    archive, output = Path(sys.argv[1]), Path(sys.argv[2])
    places: dict[str, dict] = {}
    with zipfile.ZipFile(archive) as bundle:
        exact_locations: dict[int, tuple[float, float, str | None]] = {}
        saved_name = "Maps (your places)/Saved Places.json"
        if saved_name in bundle.namelist():
            saved = json.loads(bundle.read(saved_name))
            for feature in saved.get("features", []):
                properties = feature.get("properties", {})
                match = CID.search(properties.get("google_maps_url", ""))
                coordinates = feature.get("geometry", {}).get("coordinates", [])
                if match and len(coordinates) >= 2:
                    location = properties.get("location", {})
                    exact_locations[int(match.group(1))] = (coordinates[1], coordinates[0], location.get("country_code"))
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
                feature_id = int(feature_hex, 16)
                exact = exact_locations.get(feature_id)
                if exact:
                    lat, lng, country_code = exact
                else:
                    point = CellId(int(cell_hex, 16)).to_lat_lng()
                    lat, lng, country_code = point.lat().degrees, point.lng().degrees, None
                if country_code != "JP" and not in_japan(lat, lng):
                    continue
                key = f"{cell_hex.lower()}:{feature_hex.lower()}"
                place = places.setdefault(key, {
                    "title": title,
                    "url": url,
                    "area": area_for(lat, lng),
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "categories": [],
                })
                if category not in place["categories"]:
                    place["categories"].append(category)

    clean = sorted(places.values(), key=lambda item: (item["area"], item["title"].casefold()))
    for place in clean:
        place["categories"].sort(key=str.casefold)
        place["neighborhood"] = neighborhood_for(place["area"], place["lat"], place["lng"], place["title"])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(clean, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Wrote {len(clean)} sanitized Japan venues to {output}")


if __name__ == "__main__":
    main()
