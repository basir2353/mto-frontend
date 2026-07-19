import { copyFileSync, existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const mode = process.argv[2];
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MAP = {
  local: { src: "env/local.env", dests: [".env.local"] },
  live: { src: "env/production.env", dests: [".env.local"] },
  // .env.production.local beats .env.local during `next build`
  production: { src: "env/production.env", dests: [".env.production", ".env.production.local"] },
};

if (!mode || !MAP[mode]) {
  console.error("Usage: node scripts/use-env.mjs <local|live|production>");
  process.exit(1);
}

const { src, dests } = MAP[mode];
const from = join(root, src);

if (!existsSync(from)) {
  console.error(`Missing ${src}`);
  process.exit(1);
}

for (const dest of dests) {
  const to = join(root, dest);
  copyFileSync(from, to);
  console.log(`Copied ${src} → ${dest}`);
}

if (mode === "production") {
  const content = `Copied for production build from ${src}\n`;
  writeFileSync(join(root, ".env.production.stamp"), content);
}
