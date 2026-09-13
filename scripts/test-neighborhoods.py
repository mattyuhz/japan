"""Regression checks for conservative name-based neighborhood assignment."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("importer", Path(__file__).with_name("import-google-places.py"))
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class NeighborhoodTests(unittest.TestCase):
    def test_distinct_neighborhoods_and_branch_names(self):
        cases = {
            "Jimbocho coffee": "Jimbocho",
            "Jinbōchō coffee": "Jimbocho",
            "神保町カフェ": "Jimbocho",
            "Kanda coffee": "Kanda",
            "Ginza coffee": "Ginza",
            "Yanaka Ginza": "Yanaka",
            "谷中銀座": "Yanaka",
            "Kanda Tamagoken Ikebukuro": "Ikebukuro",
            "Sushi Ginza Onodera Musuko Shibuya": "Shibuya",
            "Nakameguro coffee": "Nakameguro",
            "中目黒カフェ": "Nakameguro",
            "Asakusabashi coffee": "Asakusabashi",
            "Kandahar": "Neighborhood to confirm",
            "A venue without a locality": "Neighborhood to confirm",
        }
        for title, expected in cases.items():
            with self.subTest(title=title):
                self.assertEqual(importer.neighborhood_for("Tokyo", 35.69, 139.77, title), expected)

    def test_no_neighborhood_from_unreliable_coordinates(self):
        self.assertEqual(importer.neighborhood_for("Tokyo", 35.6959, 139.7576, "Coffee"), "Neighborhood to confirm")


if __name__ == "__main__":
    unittest.main()
