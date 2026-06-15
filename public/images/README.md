# Image drop zone

The site reads images from this folder by filename. Drop the files
listed below to fill in the content — the page picks them up on the
next reload. The site is happy with missing files (the slot stays
dark / empty) so you can deploy with partial coverage.

In normal operation `heroImage` and `gallery` come from the Ethos
dashboard via `/api/public/site-info`. The files below are the
local-fallback assets used when the API hasn't shipped a value (or
when the API is transiently unreachable).

## Files the site expects

| File                  | Where it shows                                | Suggested size         |
| --------------------- | --------------------------------------------- | ---------------------- |
| `hero.jpg`            | Full-bleed hero background on every page hero | 1920×1280 (landscape)  |
| `food-1.jpg`          | Food carousel 1                               | 1200×1200 (square)     |
| `food-2.jpg`          | Food carousel 2                               | 1200×1200 (square)     |
| `food-3.jpg`          | Food carousel 3                               | 1200×1200 (square)     |
| `local-1.jpg`         | First photo of the interior (Location section)| 900×1100 (portrait)    |
| `local-2.jpg`         | Second photo of the interior                  | 900×1100 (portrait)    |
| `card-menu.jpg`       | Landing card → Menu                           | 1200×900 (landscape)   |
| `card-reservation.jpg`| Landing card → Reserve                        | 1200×900 (landscape)   |
| `card-takeout.jpg`    | Landing card → Takeout                        | 1200×900 (landscape)   |

## Optional logo files

If the restaurant has a logo, drop SVG or PNG versions here and point
to them in `data/restaurant.ts`:

- `logoIcon` (square icon used in the Header)
- `logoWordmark` (wordmark used in the Hero)
- `logo` (omnibus, currently unused)

If you leave these `undefined`, the Header and Hero render the
restaurant `name` as text — that's a fine fallback.

## Generating placeholders

The repo ships with neutral-gradient placeholders so the initial clone
builds out of the box. To regenerate them (e.g. with a different
palette), edit and run `scripts/generate-placeholders.mjs`.
