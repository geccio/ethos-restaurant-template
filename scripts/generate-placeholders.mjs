// One-off generator for the placeholder images shipped in the
// template. Run once after cloning, then delete this script. Real
// restaurant sites swap these out with their own assets via the Ethos
// dashboard (heroImage, gallery) and/or by replacing the files in
// public/images/ directly.

import sharp from "sharp";
import { mkdir, unlink } from "node:fs/promises";

const OUT_DIR = "public/images";
await mkdir(OUT_DIR, { recursive: true });

// A neutral muted-blue gradient with a faint plate icon — communicates
// "restaurant" without committing to any cuisine or palette. Each
// generated JPG is small (under 50 KB) so the initial template clone
// has a working hero + gallery + cards out of the box.
function gradient(w, h, hueA = 215, hueB = 235) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hueA}, 18%, 28%)" />
      <stop offset="100%" stop-color="hsl(${hueB}, 20%, 14%)" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)" />
  <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.22}"
          fill="none" stroke="hsl(${hueA}, 20%, 60%)" stroke-width="2" opacity="0.35" />
  <text x="50%" y="50%" font-family="system-ui, sans-serif"
        font-size="${Math.min(w, h) * 0.04}" font-weight="500"
        text-anchor="middle" dominant-baseline="middle"
        fill="hsl(${hueA}, 20%, 78%)" opacity="0.55"
        letter-spacing="0.2em">PLACEHOLDER</text>
</svg>
`;
}

async function emit(file, w, h, hueA, hueB) {
  const svg = gradient(w, h, hueA, hueB);
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT_DIR}/${file}`);
  console.log(`  ${file}: ${w}x${h}`);
}

console.log("Generating placeholders into", OUT_DIR);

// Hero — wide, used as full-bleed background on every page hero
await emit("hero.jpg", 1920, 1280, 215, 240);

// Food carousel — square crops
await emit("food-1.jpg", 1200, 1200, 22, 14);
await emit("food-2.jpg", 1200, 1200, 195, 215);
await emit("food-3.jpg", 1200, 1200, 35, 18);

// Location interior photos — portrait
await emit("local-1.jpg", 900, 1100, 28, 20);
await emit("local-2.jpg", 900, 1100, 200, 220);

// Landing-page option cards — landscape
await emit("card-menu.jpg", 1200, 900, 25, 18);
await emit("card-reservation.jpg", 1200, 900, 215, 235);
await emit("card-takeout.jpg", 1200, 900, 32, 20);

console.log("Done. Self-delete this script with `rm scripts/generate-placeholders.mjs`.");
