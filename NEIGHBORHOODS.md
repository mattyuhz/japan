# Neighborhood explorer

Neighborhoods are separate from the regional filters: Jimbocho, Kanda and Ginza have independent filters and map centers. The shared anchor and alias catalog is `src/data/neighborhoods.json`.

The Google Takeout category-list export generally lacks exact coordinates. Google feature-ID cell centers are used only for coarse regional filtering, never for assigning a neighborhood or plotting a venue. Regional filtering is approximate too. Fine-grained labels are inferred from explicit neighborhood names in venue titles, including common Japanese and romanized variants. These are helpful suggestions, not verified addresses; a brand name can still be misleading. Unmatched listings stay in “Neighborhood to confirm.”

Map markers indicate neighborhood centers, not individual venues or official neighborhood boundaries. Nearby distances are straight-line center-to-center estimates. Walking/transit links request routes between those centers. Always use the individual venue's Maps link for its actual location.

Regenerate the sanitized venue index with the Python environment containing `scripts/requirements.txt`:

```sh
python scripts/import-google-places.py Google-Places.zip src/data/japan-places.json
python scripts/test-neighborhoods.py
```

Never commit the Takeout archive or private notes, addresses, comments or reviews. Site changes build into `docs` and publish from `origin/main` through GitHub Pages.
