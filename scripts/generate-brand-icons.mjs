import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(rootDir, "brand", "icon-source.svg");
const svgBuffer = readFileSync(svgPath);

const brand = {
  base: "#030403",
  elevated: "#08120c",
  accent: "#b8f0b8",
};

async function writePng(outputPath, size) {
  mkdirSync(dirname(outputPath), { recursive: true });
  await sharp(svgBuffer)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(outputPath);
}

async function writeWebIcons() {
  const publicIcons = join(rootDir, "public", "icons");
  const sizes = [16, 32, 48, 192, 512];

  for (const size of sizes) {
    await writePng(join(publicIcons, `icon-${size}.png`), size);
  }

  await writePng(join(rootDir, "src", "app", "icon.png"), 512);
  await writePng(join(rootDir, "src", "app", "apple-icon.png"), 180);
  await writePng(join(rootDir, "public", "icons", "apple-touch-icon.png"), 180);

  await writePng(join(rootDir, "public", "icons", "favicon-16.png"), 16);
  await writePng(join(rootDir, "public", "icons", "favicon-32.png"), 32);
}

async function writeTauriSource() {
  const tauriSource = join(rootDir, "desktop", "icon-source.png");
  await writePng(tauriSource, 1024);
  return tauriSource;
}

function writeAndroidBrandFiles() {
  const valuesDir = join(
    rootDir,
    "desktop",
    "src-tauri",
    "icons",
    "android",
    "values",
  );

  mkdirSync(valuesDir, { recursive: true });
  writeFileSync(
    join(valuesDir, "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">${brand.base}</color>\n</resources>\n`,
  );
}

function runTauriIcon(sourcePath) {
  const result = spawnSync(
    "npx",
    ["tauri", "icon", sourcePath, "-o", "src-tauri/icons"],
    {
      cwd: join(rootDir, "desktop"),
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  console.log("Generating web icons from brand/icon-source.svg ...");
  await writeWebIcons();

  console.log("Generating Tauri icon set ...");
  const tauriSource = await writeTauriSource();
  writeAndroidBrandFiles();
  runTauriIcon(tauriSource);

  console.log("Brand icons generated.");
  console.log(`Colors: base ${brand.base}, elevated ${brand.elevated}, accent ${brand.accent}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
