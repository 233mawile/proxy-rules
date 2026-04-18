import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const subtransDir = path.join(projectRoot, "subtrans");
const releaseDir = path.join(projectRoot, "release");
const sourcesJsonPath = path.join(releaseDir, "sources.json");
const sourcesBaseUrl =
  "https://raw.githubusercontent.com/233mawile/proxy-rules/main/release";
const ignoredEntryFiles = new Set(["common.js"]);

const dirEntries = await readdir(subtransDir, { withFileTypes: true });
const entryFiles = dirEntries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter(
    (name) =>
      path.extname(name) === ".js" && !ignoredEntryFiles.has(name),
  )
  .sort();

if (entryFiles.length === 0) {
  throw new Error("No subtrans entry files found to publish.");
}

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

const sourcesConfig = {};

for (const entryFile of entryFiles) {
  const entryName = path.basename(entryFile, ".js");
  const bundledEntryPath = path.join(releaseDir, entryFile);

  await build({
    entryPoints: [path.join(subtransDir, entryFile)],
    bundle: true,
    format: "esm",
    platform: "neutral",
    outfile: bundledEntryPath,
    minify: false,
    sourcemap: false,
    legalComments: "none",
  });

  sourcesConfig[entryName] = `${sourcesBaseUrl}/${entryFile}`;
}

await writeFile(
  sourcesJsonPath,
  JSON.stringify(sourcesConfig, null, 2) + "\n",
);
