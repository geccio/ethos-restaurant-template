// Vectorize the bitmap UNAGUI logo crops to SVG.
// Run from project root: node scripts/trace-logo.js
const fs = require("node:fs");
const path = require("node:path");
const potrace = require("potrace");

const dir = path.join(__dirname, "..", "public", "images");

const targets = [
  { in: "logo-icon-bw.png",     out: "logo-icon.svg" },
  { in: "logo-wordmark-bw.png", out: "logo-wordmark.svg" },
];

const opts = {
  // Anything darker than this is treated as fill; lighter is background.
  threshold: 160,
  // Drop specks smaller than this (cleans up noise).
  turdSize: 2,
  // Smoothness of curves: 1.0 keeps geometry true; 1.3 is rounder.
  alphaMax: 1.0,
  // Curve optimization tolerance.
  optTolerance: 0.2,
  // Render the foreground in white so it shows on the dark theme directly.
  color: "#ffffff",
  background: "transparent",
};

(async () => {
  for (const t of targets) {
    const inPath  = path.join(dir, t.in);
    const outPath = path.join(dir, t.out);
    if (!fs.existsSync(inPath)) {
      console.error("missing:", inPath);
      continue;
    }
    const svg = await new Promise((resolve, reject) => {
      potrace.trace(inPath, opts, (err, svg) => (err ? reject(err) : resolve(svg)));
    });
    fs.writeFileSync(outPath, svg, "utf8");
    console.log(`wrote ${t.out}  (${svg.length} bytes)`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
