import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultSource = path.resolve(repoRoot, "..", "03_인사이트", "_wiki_build", "concept_registry.json");
const defaultOutput = path.join(repoRoot, "knowledge", "method", "concepts.json");

function optionValue(args, name, fallback) {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : fallback;
}

function stringsOnly(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))];
}

function pickConcept(entry) {
  if (!entry || typeof entry !== "object") return null;
  const slug = typeof entry.slug === "string" ? entry.slug.trim() : "";
  const definition = typeof entry.definition === "string" ? entry.definition.trim() : "";
  if (!slug || !definition) return null;
  return {
    slug,
    definition,
    aliases: stringsOnly(entry.aliases),
    related: stringsOnly(entry.related),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const source = path.resolve(process.cwd(), optionValue(args, "--source", defaultSource));
  const output = path.resolve(repoRoot, optionValue(args, "--output", path.relative(repoRoot, defaultOutput)));
  const registry = JSON.parse(await readFile(source, "utf8"));

  if (!registry || typeof registry !== "object" || !Array.isArray(registry.concepts)) {
    throw new Error("concept_registry.json에 concepts 배열이 없습니다.");
  }

  const concepts = registry.concepts
    .filter((entry) => entry?.tier === "core" || entry?.tier === "standard")
    .map(pickConcept)
    .filter((entry) => entry !== null)
    .sort((left, right) => left.slug.localeCompare(right.slug, "ko"));

  if (concepts.length === 0) {
    throw new Error("core 또는 standard 개념을 찾지 못했습니다.");
  }

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(concepts, null, 2)}\n`, "utf8");
  console.log(`Built ${concepts.length} concepts -> ${path.relative(repoRoot, output)}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "개념 발췌에 실패했습니다.";
  console.error(message);
  process.exitCode = 1;
});
