import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const subtransDir = path.join(projectRoot, "subtrans");
const envPath = path.join(projectRoot, ".env");
const sourcesJsonPath = path.join(projectRoot, "release", "sources.json");
const subscriptionJsonPath = path.join(projectRoot, "subscription.json");
const ignoredEntryFiles = new Set(["common.js"]);

const envContent = await readFile(envPath, "utf8");
const envConfig = parse(envContent);
const sourcesContent = await readFile(sourcesJsonPath, "utf8");
const sourcesConfig = JSON.parse(sourcesContent);
const subtransUrl = envConfig.SUBTRANS_URL;

if (!subtransUrl) {
  throw new Error("Missing SUBTRANS_URL in .env");
}

if (typeof sourcesConfig !== "object" || sourcesConfig === null) {
  throw new Error("Invalid release/sources.json content");
}

const dirEntries = await readdir(subtransDir, { withFileTypes: true });
const entryNames = dirEntries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter(
    (name) =>
      path.extname(name) === ".js" && !ignoredEntryFiles.has(name),
  )
  .map((name) => path.basename(name, ".js"))
  .sort();

const missingSourceUrls = entryNames.filter((entryName) => !envConfig[entryName]);
const missingScriptUrls = entryNames.filter(
  (entryName) => typeof sourcesConfig[entryName] !== "string",
);

if (missingSourceUrls.length > 0) {
  throw new Error(
    `Missing source URLs in .env for: ${missingSourceUrls.join(", ")}`,
  );
}

if (missingScriptUrls.length > 0) {
  throw new Error(
    `Missing script URLs in release/sources.json for: ${missingScriptUrls.join(", ")}`,
  );
}

const subscriptionConfig = Object.fromEntries(
  entryNames.map((entryName) => {
    const sourceUrl = envConfig[entryName];
    const scriptUrl = sourcesConfig[entryName];
    const subscriptionUrl = `${subtransUrl}/?url=${encodeURIComponent(sourceUrl)}&script=${encodeURIComponent(scriptUrl)}`;
    return [entryName, subscriptionUrl];
  }),
);

await writeFile(
  subscriptionJsonPath,
  JSON.stringify(subscriptionConfig, null, 2) + "\n",
);
