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


NEIGHBORHOODS = {
    "Tokyo": (
        ("Kabutocho / Nihonbashi", 35.6828, 139.7780), ("Ginza / Marunouchi", 35.6742, 139.7632),
        ("Shibuya", 35.6595, 139.7005), ("Ebisu / Daikanyama", 35.6484, 139.7050),
        ("Aoyama / Omotesando", 35.6652, 139.7122), ("Nakameguro", 35.6443, 139.6991),
        ("Shinjuku", 35.6938, 139.7034), ("Shimokitazawa", 35.6616, 139.6680),
        ("Koenji / Nakano", 35.7053, 139.6587), ("Kichijoji", 35.7033, 139.5797),
        ("Roppongi / Akasaka", 35.6670, 139.7350), ("Kanda / Jimbocho", 35.6948, 139.7577),
        ("Ueno / Yanaka", 35.7190, 139.7730), ("Asakusa / Kuramae", 35.7107, 139.7937),
        ("Ikebukuro", 35.7295, 139.7109), ("Tsukiji / Kachidoki", 35.6617, 139.7770),
        ("Setagaya", 35.6466, 139.6532), ("Yokohama", 35.4437, 139.6380),
        ("Chiba", 35.6073, 140.1063), ("Saitama", 35.8617, 139.6455),
    ),
    "Kamakura": (("Kamakura", 35.3192, 139.5467), ("Kita-Kamakura", 35.3373, 139.5441), ("Yuigahama / Hase", 35.3112, 139.5352)),
    "Kyoto": (("Central Kyoto", 35.0116, 135.7681), ("Gion / Higashiyama", 35.0037, 135.7786), ("Arashiyama", 35.0094, 135.6668), ("Fushimi", 34.9355, 135.7616), ("Northern Kyoto", 35.0450, 135.7500)),
    "Osaka": (("Umeda / Kitashinchi", 34.7025, 135.4959), ("Namba / Shinsaibashi", 34.6690, 135.5010), ("Nakazakicho / Tenma", 34.7060, 135.5080), ("Fukushima", 34.6955, 135.4865), ("Tennoji", 34.6467, 135.5133), ("Sakai", 34.5733, 135.4831), ("Kobe", 34.6901, 135.1955), ("Nara", 34.6851, 135.8048)),
}


TITLE_NEIGHBORHOODS = {
    "Tokyo": (
        ("Kabutocho / Nihonbashi", ("kabutocho", "nihonbashi", "kayabacho", "kiyosumi", "monzen-nakacho")),
        ("Ginza / Marunouchi", ("ginza", "marunouchi", "yurakucho", "hibiya", "tokyo station")),
        ("Shibuya", ("shibuya", "harajuku", "sendagaya")),
        ("Ebisu / Daikanyama", ("ebisu", "daikanyama")),
        ("Aoyama / Omotesando", ("aoyama", "omotesando")),
        ("Nakameguro", ("nakameguro", "naka-meguro", "meguro")),
        ("Shinjuku", ("shinjuku", "kabukicho")),
        ("Shimokitazawa", ("shimokitazawa", "shimo-kitazawa")),
        ("Koenji / Nakano", ("koenji", "nakano")),
        ("Kichijoji", ("kichijoji", "mitaka", "ogikubo")),
        ("Roppongi / Akasaka", ("roppongi", "akasaka", "azabu", "toranomon")),
        ("Kanda / Jimbocho", ("kanda", "jimbocho", "akihabara", "ochanomizu")),
        ("Ueno / Yanaka", ("ueno", "yanaka", "nippori")),
        ("Asakusa / Kuramae", ("asakusa", "kuramae", "ryogoku", "skytree")),
        ("Ikebukuro", ("ikebukuro",)),
        ("Tsukiji / Kachidoki", ("tsukiji", "kachidoki", "toyosu", "odaiba")),
    ),
    "Kamakura": (("Kita-Kamakura", ("kita-kamakura",)), ("Yuigahama / Hase", ("yuigahama", "hase"))),
    "Kyoto": (("Gion / Higashiyama", ("gion", "higashiyama")), ("Arashiyama", ("arashiyama",)), ("Fushimi", ("fushimi",))),
    "Osaka": (("Umeda / Kitashinchi", ("umeda", "kitashinchi")), ("Namba / Shinsaibashi", ("namba", "shinsaibashi")), ("Nakazakicho / Tenma", ("nakazakicho", "tenma")), ("Fukushima", ("fukushima",)), ("Tennoji", ("tennoji",)), ("Sakai", ("sakai",)), ("Kobe", ("kobe",)), ("Nara", ("nara",))),
}


def neighborhood_for(area: str, lat: float, lng: float, title: str) -> str:
    folded = title.casefold()
    for neighborhood, clues in TITLE_NEIGHBORHOODS.get(area, ()):
        if any(clue in folded for clue in clues):
            return neighborhood
    anchors = NEIGHBORHOODS.get(area)
    if not anchors:
        return "Elsewhere in Japan"
    return min(anchors, key=lambda item: distance_km(lat, lng, item[1], item[2]))[0]


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
