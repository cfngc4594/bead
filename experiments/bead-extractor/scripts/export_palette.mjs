import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const scriptDir = path.dirname(url.fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const sourcePath = path.resolve(
  projectDir,
  "../../packages/core/src/colors.ts",
);
const outputPath = path.resolve(projectDir, "data/mard_colors.json");
const source = fs.readFileSync(sourcePath, "utf8");
const colors = [...source.matchAll(/code: "([^"]+)", hex: "(#[0-9A-F]+)"/g)].map(
  ([, code, hex]) => ({ code, hex }),
);

if (colors.length !== 291) {
  throw new Error(`Expected 291 MARD colors, found ${colors.length}`);
}

const result = {
  source: "packages/core/src/colors.ts",
  profiles: {
    "221": colors.slice(0, 221).map(({ code }) => code),
    "264": colors.slice(0, 264).map(({ code }) => code),
    "291": colors.map(({ code }) => code),
  },
  canonicalAliases: {
    R11: "Q4",
  },
  colors,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Wrote ${colors.length} colors to ${outputPath}`);
