import conceptsRaw from "@/knowledge/method/concepts.json";

export type Concept = {
  readonly slug: string;
  readonly definition: string;
  readonly aliases: readonly string[];
  readonly related: readonly string[];
};

export type ConceptHelp = Concept;

const CONCEPTS: readonly Concept[] = conceptsRaw;

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[\s()[\]{}.,:;"'·<>/!?_-]/g, "");
}

function scoreConcept(concept: Concept, normalizedQuery: string): number {
  if (normalize(concept.slug) === normalizedQuery) return 100;
  if (concept.aliases.some((alias) => normalize(alias) === normalizedQuery)) return 95;
  if (normalize(concept.slug).includes(normalizedQuery)) return 80;
  if (concept.aliases.some((alias) => normalize(alias).includes(normalizedQuery))) return 75;
  if (normalize(concept.definition).includes(normalizedQuery)) return 20;
  return 0;
}

export function findConcepts(query: string, limit = 5): readonly Concept[] {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return [];

  return CONCEPTS
    .map((concept) => ({ concept, score: scoreConcept(concept, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.concept.slug.localeCompare(right.concept.slug, "ko"))
    .slice(0, limit)
    .map(({ concept }) => concept);
}

export function getConceptHelp(query: string): ConceptHelp | null {
  return findConcepts(query, 1)[0] ?? null;
}

export function buildConceptPromptContext(terms: readonly string[]): string {
  const concepts = terms.flatMap((term) => findConcepts(term, 1));
  const unique = [...new Map(concepts.map((concept) => [concept.slug, concept])).values()];
  if (unique.length === 0) return "";

  return unique
    .map((concept) => `- ${concept.slug}: ${concept.definition}\n  관련 개념: ${concept.related.join(", ")}`)
    .join("\n");
}
