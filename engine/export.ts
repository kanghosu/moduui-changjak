import { z } from "zod";
import type { Character } from "./schema";
import type { Work } from "./library";

const FORMAT = "modu-story-work" as const;
const VERSION = 1 as const;
const ACTS = [1, 2, 3, 4] as const;
const FILENAME_FORBIDDEN = /[\\:*?"<>|]/g;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/g;

export type SingleWorkEnvelopeV1 = {
  readonly format: typeof FORMAT;
  readonly version: typeof VERSION;
  readonly exportedAt: number;
  readonly work: Work;
};

export type CollectionEnvelopeV1 = {
  readonly format: typeof FORMAT;
  readonly version: typeof VERSION;
  readonly exportedAt: number;
  readonly works: Work[];
};

export type ImportResult =
  | { readonly ok: true; readonly works: Work[] }
  | { readonly ok: false; readonly reason: string };

type FileExtension = "json" | "md";
type ReadonlyRecord = Readonly<Record<string, unknown>>;

export function toWorkEnvelope(work: Work, now: number): SingleWorkEnvelopeV1 {
  return { format: FORMAT, version: VERSION, exportedAt: now, work };
}

export function toWorksEnvelope(works: Work[], now: number): CollectionEnvelopeV1 {
  return { format: FORMAT, version: VERSION, exportedAt: now, works };
}

/** 설계문서의 API 이름과 함께, UI가 바로 다운로드할 수 있는 JSON 문자열도 제공한다. */
export function exportWork(work: Work, exportedAt: number): string {
  return JSON.stringify(toWorkEnvelope(work, exportedAt), null, 2);
}

export function exportWorks(works: Work[], exportedAt: number): string {
  return JSON.stringify(toWorksEnvelope(works, exportedAt), null, 2);
}

export function toMarkdown(work: Work): string {
  const story = work.story;
  const title = firstText(work.title, story.title, "제목 없는 이야기");
  const lines: string[] = [
    `# ${title}`,
    "",
    "## 로그라인",
    "",
    displayText(story.logline),
    "",
    "## 프리미스",
    "",
    displayText(story.premise),
    "",
    "## 장르 / 톤 / 타깃",
    "",
    `- 장르: ${displayText(story.genre)}`,
    `- 톤: ${displayText(story.tone)}`,
    `- 타깃: ${displayText(story.target)}`,
    "",
    "## 후크",
    "",
    displayText(story.hookNote),
    "",
    "## 인물",
    "",
    "| 이름 | 역할 | 겉욕망 | 속결핍 | 변화 |",
    "| --- | --- | --- | --- | --- |",
  ];

  if (story.characters.length === 0) {
    lines.push("| (없음) | - | - | - | - |");
  } else {
    for (const character of story.characters) lines.push(characterRow(character));
  }

  lines.push("");
  const blocks = [...story.blocks].sort((a, b) => a.index - b.index);
  for (const act of ACTS) {
    lines.push(`## ${act}막`, "");
    for (const block of blocks.filter((candidate) => candidate.act === act)) {
      lines.push(
        `#### 블록 ${block.index}`,
        `- index: ${block.index}`,
        `- act: ${block.act}`,
        `- function: ${displayText(block.function)}`,
        `- beat: ${displayText(block.beat || block.summary)}`,
        "",
      );
    }
  }

  lines.push("## 노트", "");
  if (story.notes.length === 0) lines.push("- (없음)");
  else for (const note of story.notes) lines.push(`- ${note}`);

  return `${lines.join("\n")}\n`;
}

export function workToMarkdown(work: Work): string {
  return toMarkdown(work);
}

export function safeFileName(title: string, ext: FileExtension, now: number): string {
  const sanitized = title.trim().replace(FILENAME_FORBIDDEN, "_").replace(/\//g, "_").replace(CONTROL_CHARACTERS, "_").trim();
  const safeTitle = sanitized || "제목 없는 이야기";
  // 사용자가 보는 날짜와 맞춘다. UTC를 쓰면 한국(UTC+9)에서 오전 9시 이전에 내보낼 때
  // 파일명에 전날 날짜가 찍혀, 사용자가 "어제 파일"로 오해한다.
  const date = new Date(now);
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${safeTitle}_${year}${month}${day}.${ext}`;
}

export function filenameFor(work: Work, ext: FileExtension, exportedAt: number): string {
  return safeFileName(work.title || work.story.title || "", ext, exportedAt);
}

export function parseImport(raw: string, existingIds: readonly string[]): ImportResult {
  if (raw.trim() === "") return failure("가져올 파일이 비어 있어요.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause: unknown) {
    if (cause instanceof SyntaxError) return failure("JSON 파일로 읽을 수 없어요.");
    throw cause;
  }

  if (!isRecord(parsed) || parsed.format !== FORMAT) return failure("모두의 창작 내보내기 형식이 아니에요.");
  if (!hasOwn(parsed, "version")) return failure("내보내기 버전 정보가 없어요.");
  if (parsed.version !== VERSION) return failure("지원하지 않는 내보내기 버전이에요.");
  if (!hasOwn(parsed, "exportedAt") || typeof parsed.exportedAt !== "number" || !Number.isFinite(parsed.exportedAt)) {
    return failure("내보내기 시각 정보가 올바르지 않아요.");
  }

  const hasSingle = hasOwn(parsed, "work");
  const hasCollection = hasOwn(parsed, "works");
  if (hasSingle === hasCollection) return failure("내보내기 작품 항목이 하나만 있어야 해요.");

  const importedWorks = hasSingle ? parseSingle(parsed.work) : parseCollection(parsed.works);
  if (!importedWorks) return failure("유효한 작품 데이터가 아니에요.");
  return { ok: true, works: assignUniqueIds(importedWorks, existingIds) };
}

function isRecord(value: unknown): value is ReadonlyRecord {
  return typeof value === "object" && value !== null;
}

function hasOwn(record: ReadonlyRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isWork(value: unknown): value is Work {
  if (!isRecord(value) || typeof value.id !== "string" || !isRecord(value.story)) return false;
  return Boolean(value.story.blocks);
}

const importedWorkSchema = z.custom<Work>(isWork);

function parseSingle(value: unknown): Work[] | null {
  const parsed = importedWorkSchema.safeParse(value);
  return parsed.success ? [parsed.data] : null;
}

function parseCollection(value: unknown): Work[] | null {
  if (!Array.isArray(value)) return null;
  const works: Work[] = [];
  for (const item of value) {
    const parsed = importedWorkSchema.safeParse(item);
    if (!parsed.success) return null;
    works.push(parsed.data);
  }
  return works;
}

function assignUniqueIds(works: readonly Work[], existingIds: readonly string[]): Work[] {
  const occupied = new Set(existingIds);
  return works.map((work) => {
    if (!occupied.has(work.id)) {
      occupied.add(work.id);
      return work;
    }

    const base = work.id.trim() ? `${work.id}-imported` : "imported-work";
    let candidate = base;
    let suffix = 2;
    while (occupied.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    occupied.add(candidate);
    return { ...work, id: candidate };
  });
}

function failure(reason: string): { readonly ok: false; readonly reason: string } {
  return { ok: false, reason };
}

function firstText(...values: readonly (string | undefined)[]): string {
  return values.find((value) => value?.trim())?.trim() || "제목 없는 이야기";
}

function displayText(value: string | undefined): string {
  return value?.trim() || "(비어 있음)";
}

function tableText(value: string): string {
  return value.replace(/\r?\n|\r/g, "<br>").replace(/\|/g, "\\|");
}

function characterRow(character: Character): string {
  const role = {
    protagonist: "주인공",
    antagonist: "적대자",
    ally: "동료",
    supporting: "조연",
  }[character.role];
  return `| ${tableText(character.name)} | ${tableText(role)} | ${tableText(character.want)} | ${tableText(character.need)} | ${tableText(character.arc)} |`;
}
