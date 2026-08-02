import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const flavor = process.argv[2] === "driver" ? "driver" : "customer";
const outName =
  flavor === "driver" ? "MoveThisOut-Driver-debug.apk" : "MoveThisOut-Customer-debug.apk";

const src = join(
  root,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  flavor,
  "debug",
  `app-${flavor}-debug.apk`,
);
const distDir = join(root, "dist");
const dest = join(distDir, outName);

if (!existsSync(src)) {
  console.error(`APK not found: ${src}`);
  process.exit(1);
}
mkdirSync(distDir, { recursive: true });
copyFileSync(src, dest);
console.log(`Copied → ${dest}`);
