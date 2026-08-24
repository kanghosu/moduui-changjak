import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const BenchmarkSchema = z.object({
  title: z.string().default("제목 미상"),
  year: z.string().optional().default(""),
  genre: z.string().optional().default(""),
  keyword: z.string().optional().default(""),
  logline: z.string().optional().default(""),
  premise: z.string().optional().default(""),
  fourActLogline: z.string().optional().default(""),
  takeaway: z.string().optional().default(""),
  blocks: z.array(z.object({
    index: z.number().int(),
    subtitle: z.string().optional().default(""),
    summary: z.string().optional().default(""),
    externalEvent: z.string().optional().default(""),
    internalEmotion: z.string().optional().default(""),
  })).default([]),
});

type BenchmarkRecord = z.infer<typeof BenchmarkSchema>;

export type BenchmarkSummary = {
  readonly title: string;
  readonly year: string;
  readonly genre: string;
  readonly reason: string;
  readonly matchedBlocks: readonly number[];
};

const STOP_TOKENS = new Set(["주인공", "이야기", "영화", "장면", "사람", "자신", "것", "그리고", "대한", "통해", "위해"]);
const PARTICLES = ["에서", "에게", "으로", "처럼", "까지", "부터", "보다", "을", "를", "은", "는", "이", "가", "에", "로", "와", "과", "도", "만", "의"];
const ROOT = process.cwd();
let cache: { readonly at: number; readonly items: readonly BenchmarkRecord[] } | null = null;

function compact(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[\s()[\]{}.,:;"'·<>/!?_-]/g, "");
}

function tokenize(value: string): readonly string[] {
  const words = value.normalize("NFKC").toLocaleLowerCase("ko-KR").match(/[가-힣]{2,}|[a-z0-9]{2,}/g) ?? [];
  return [...new Set(words.flatMap((word) => {
    const particle = PARTICLES.find((candidate) => word.endsWith(candidate) && word.length - candidate.length >= 2);
    return particle ? [word, word.slice(0, -particle.length)] : [word];
  }).filter((word) => !STOP_TOKENS.has(word)))];
}

async function loadBenchmarks(): Promise<readonly BenchmarkRecord[]> {
  if (cache && Date.now() - cache.at < 30_000) return cache.items;

  const items: BenchmarkRecord[] = [];
  try {
    const directory = path.join(ROOT, "engine", "ai-library");
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json"));
    for (const file of files) {
      try {
        const parsed = BenchmarkSchema.safeParse(JSON.parse(await fs.readFile(path.join(directory, file), "utf8")));
        if (parsed.success && parsed.data.blocks.length > 0) items.push(parsed.data);
      } catch {
        // 개별 벤치마크 파일이 깨져도 나머지 라이브러리는 사용할 수 있다.
      }
    }
  } catch {
    // 라이브러리 디렉터리가 없으면 빈 결과로 폴백한다.
  }

  cache = { at: Date.now(), items };
  return items;
}

function searchableText(record: BenchmarkRecord, candidateIndices: readonly number[]): string {
  const pickedBlocks = record.blocks
    .filter((block) => candidateIndices.includes(block.index))
    .map((block) => [block.subtitle, block.summary, block.externalEvent, block.internalEmotion].join(" "))
    .join(" ");
  return [record.title, record.genre, record.keyword, record.logline, record.premise, record.fourActLogline, record.takeaway, pickedBlocks].join(" ");
}

function scoreBenchmark(sceneText: string, record: BenchmarkRecord, candidateIndices: readonly number[]) {
  const sceneTokens = tokenize(sceneText);
  const text = searchableText(record, candidateIndices);
  const normalizedText = compact(text);
  const matched = sceneTokens.filter((token) => normalizedText.includes(compact(token)));
  const matchedBlocks = record.blocks
    .filter((block) => candidateIndices.includes(block.index))
    .filter((block) => sceneTokens.some((token) => compact([block.subtitle, block.summary, block.externalEvent].join(" ")).includes(compact(token))))
    .map((block) => block.index);
  const score = new Set(matched).size * 3 + matchedBlocks.length * 2;
  return { record, score, matched: [...new Set(matched)].slice(0, 3), matchedBlocks };
}

export async function findSimilarBenchmarks(sceneText: string, candidateIndices: readonly number[]): Promise<readonly BenchmarkSummary[]> {
  const records = await loadBenchmarks();
  return records
    .map((record) => scoreBenchmark(sceneText, record, candidateIndices))
    .sort((left, right) => right.score - left.score || right.record.year.localeCompare(left.record.year) || left.record.title.localeCompare(right.record.title, "ko"))
    .slice(0, 2)
    .map(({ record, matched, matchedBlocks }) => ({
      title: record.title,
      year: record.year,
      genre: record.genre,
      reason: matched.length > 0
        ? `장면의 '${matched.join("', '")}' 단서와 ${matchedBlocks.length > 0 ? `${matchedBlocks.join(", ")}블록의 전개가 ` : "이야기 전개가 "}유사합니다.`
        : `장르와 24블록의 ${candidateIndices.join(", ")}번 후보 흐름을 비교할 수 있는 벤치마크입니다.`,
      matchedBlocks,
    }));
}
