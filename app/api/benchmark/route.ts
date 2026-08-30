import { NextRequest, NextResponse } from "next/server";
import { buildRequestParams, refusalOf } from "@/engine/model-capabilities";
import { MODEL_MAIN } from "@/engine/models";
import { promises as fs } from "fs";
import path from "path";
import { validateStructure, type Story } from "@/engine/schema";
import libraryRaw from "@/engine/benchmark-library.json";

export const runtime = "nodejs";

const LIBRARY = libraryRaw as unknown as Story[];
const ROOT = process.cwd();

function normTitle(s: string): string {
  return (s || "").replace(/[\s<>:,·\[\]()「」『』·.\-]/g, "").toLowerCase();
}

// AI 분석 라이브러리 — engine/ai-library/*.json 을 요청 시점에 읽음 (파일이 늘어나면 자동 반영)
let aiCache: { at: number; items: Story[] } | null = null;
async function loadAiLibrary(): Promise<Story[]> {
  if (aiCache && Date.now() - aiCache.at < 30_000) return aiCache.items;
  const items: Story[] = [];
  try {
    const dir = path.join(ROOT, "engine", "ai-library");
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    const masterTitles = new Set(LIBRARY.map((s) => normTitle(s.title || "")));
    for (const f of files) {
      try {
        const s = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as Story;
        if (!Array.isArray(s?.blocks) || s.blocks.length !== 24) continue;
        if (masterTitles.has(normTitle(s.title || ""))) continue; // 거장 확정본이 항상 우선
        s.origin = "ai";
        if (!Array.isArray(s.notes)) s.notes = [];
        items.push(s);
      } catch { /* 깨진 파일은 건너뜀 */ }
    }
    items.sort((a, b) => (b.year || "").localeCompare(a.year || ""));
  } catch { /* 폴더 없으면 빈 목록 */ }
  aiCache = { at: Date.now(), items };
  return items;
}

function findIn(list: Story[], title: string): Story | undefined {
  const q = normTitle(title);
  if (!q) return undefined;
  return (
    list.find((s) => normTitle(s.title || "") === q) ||
    list.find((s) => normTitle(s.title || "").includes(q) || q.includes(normTitle(s.title || "")))
  );
}

function findInLibrary(title: string): Story | undefined {
  return findIn(LIBRARY, title);
}

async function readFileSafe(rel: string): Promise<string> {
  try {
    return await fs.readFile(path.join(ROOT, rel), "utf8");
  } catch {
    return "";
  }
}

// 라이브러리에서 few-shot 예시(거장 확정 분석)를 컴팩트하게 직렬화
function fewShot(titles: string[]): string {
  const picked = titles.map((t) => findInLibrary(t)).filter(Boolean) as Story[];
  return picked
    .map((s) => {
      const blocks = s.blocks
        .map((b) => `${b.index}.[${b.function}] ${b.subtitle || ""} :: ${(b.summary || "").slice(0, 80)}`)
        .join("\n");
      return `### 예시: ${s.title} (${s.year})\n4막로그라인: ${(s.fourActLogline || "").slice(0, 200)}\n${blocks}`;
    })
    .join("\n\n");
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON 객체를 찾을 수 없음");
  return JSON.parse(cleaned.slice(start, end + 1));
}

// GET: 라이브러리 목록 (포스터 포함, UI용) — 거장 확정 + AI 분석
export async function GET() {
  const { posterFor } = await import("@/engine/tmdb");
  const ai = await loadAiLibrary();
  const all = [
    ...LIBRARY.map((s) => ({ s, origin: "master" as string })),
    ...ai.map((s) => ({ s, origin: "ai" as string })),
  ];
  const list = await Promise.all(
    all.map(async ({ s, origin }) => {
      const hit = await posterFor(s.title || "", s.year || undefined).catch(() => null);
      const kw = (s.keyword || "").trim();
      return {
        title: s.title,
        year: (s.year || hit?.year || "").slice(0, 4),
        keyword: kw.length > 0 && kw.length <= 6 ? kw : "", // 메타 오추출 잡음 제거
        analyst: s.analyst,
        origin,
        posterUrl: hit?.posterUrl ?? null,
        backdropUrl: hit?.backdropUrl ?? null,
      };
    })
  );
  return NextResponse.json({ list, tmdb: true });
}

// POST: 영화 제목 → 24블록 벤치마크 분석 (키 있으면 AI 자동 분석, 없으면 라이브러리)
export async function POST(req: NextRequest) {
  let body: { title?: string; year?: string; genre?: string; info?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }
  const title = body?.title?.trim();
  if (!title) return NextResponse.json({ error: "영화 제목을 입력하세요." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 1) 라이브러리에 거장 확정 분석이 있으면 우선 제공 (키 유무 무관, 가장 정확)
  const hit = findInLibrary(title);
  if (hit) {
    return NextResponse.json({
      story: { ...hit, origin: "master" },
      issues: validateStructure(hit),
      engine: "library",
      mode: "benchmark",
    });
  }

  // 1.5) AI 분석 라이브러리 (사전 생성된 흥행작 분석)
  const aiHit = findIn(await loadAiLibrary(), title);
  if (aiHit) {
    return NextResponse.json({
      story: { ...aiHit, origin: "ai" },
      issues: validateStructure(aiHit),
      engine: "ai-library",
      mode: "benchmark",
    });
  }

  // 2) 라이브러리에 없으면: 키가 있을 때만 AI 자동 분석
  if (!apiKey) {
    return NextResponse.json({
      needsKey: true,
      engine: "none",
      mode: "benchmark",
      available: LIBRARY.map((s) => s.title),
      message:
        `'${title}'는 거장 확정 라이브러리에 아직 없어요. ANTHROPIC_API_KEY를 연결하면 어떤 영화든 AI가 자동으로 24블록 분석을 생성합니다. (지금은 아래 라이브러리 작품으로 체험해보세요)`,
    });
  }

  // 3) AI 자동 분석 (거장 형식 + few-shot 근거)
  try {
    const [blocks, genreGuide, masters] = await Promise.all([
      readFileSafe("knowledge/method/24block.md"),
      readFileSafe("knowledge/method/genre-guidelines.md"),
      readFileSafe("knowledge/method/masters-crosswalk.md"),
    ]);
    const examples = fewShot(["명량", "기생충"]);
    const model = MODEL_MAIN;
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const system = `너는 김태원 「욕망의 레시피」 작법 엔진의 '벤치마크 분석가'다.
사용자가 준 영화를 4막·24블록 구조로 분석해, 거장의 벤치마크 템플릿 형식의 JSON으로만 출력한다.

## 구조 규칙 (반드시 준수 — 규범)
${blocks}

## 장르별 블록 지침 (김태원 템플릿 원본 — 장르에 맞춰 적용)
${genreGuide}

## 세계 거장 프레임워크 교차표 (보조 검증용 — 충돌 시 위 규범 우선)
${masters}

## 거장 확정 분석 예시 (형식·밀도의 기준)
${examples}

## 출력 형식 (JSON 객체 하나만, 코드펜스/설명 금지)
{
  "title": "영화 제목", "year": "개봉년도", "genre": "장르", "keyword": "핵심 키워드",
  "logline": "...", "premise": "...", "target": "...", "tone": "",
  "fourActLogline": "1막→2막→3막→4막을 잇는 네 줄 로그라인",
  "takeaway": "착안점(장르 특징·교훈·MyStory 적용)",
  "reversalPointIndex": 13,
  "characters": [{"id":"protagonist","name":"...","role":"protagonist","want":"즉자적 욕망","need":"대자적 욕망/결핍","arc":"..."}, {"id":"antagonist","name":"...","role":"antagonist","want":"...","need":"...","arc":"..."}],
  "blocks": [ {"index":1,"act":1,"function":"오프닝 이벤트 ...","subtitle":"블록 소제목","summary":"줄거리 요약(2~4줄)","externalEvent":"외적 사건","internalEmotion":"내적 정서"}, ... 24개 ... ]
}
규칙: blocks는 정확히 24개. 13번 block에 "isReversal":true. 9·14·18번에 "antagonistEscalation":true. 8·15·22번에 "bStory":true. 실제 영화 내용을 모르면 추측하지 말고 가장 보편적으로 알려진 줄거리에 근거하라.`;

    const callOnce = async (extra = ""): Promise<Story> => {
      const resp = await client.messages.create({
        model,
        ...buildRequestParams(model!, { maxTokens: 8000 }),
        system,
        messages: [{ role: "user", content: `영화: ${title}${body.year ? ` (${body.year})` : ""}${body.genre ? ` / 장르: ${body.genre}` : ""}${body.info ? `\n참고: ${body.info}` : ""}${extra}` }],
      });
      // 안전 분류기가 거부하면 HTTP 200에 stop_reason="refusal"이 온다.
      // 확인하지 않으면 빈 content를 정상 응답으로 착각해 파싱 오류로 둔갑한다.
      const _refusal = refusalOf(resp);
      if (_refusal.refused) throw new Error(`모델이 요청을 거부했습니다${_refusal.category ? ` (${_refusal.category})` : ""}.`);
      const text = resp.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return extractJson(text) as Story;
    };

    let story: Story;
    try {
      story = await callOnce();
    } catch {
      story = await callOnce("\n\n반드시 24개 블록을 가진 JSON 객체 하나만 출력하라.");
    }
    story.origin = "ai";
    if (!Array.isArray(story.notes)) story.notes = [];
    story.notes.unshift(`[AI 자동 분석] '${title}'를 거장 템플릿 형식으로 자동 생성 (Anthropic ${model}).`);

    return NextResponse.json({ story, issues: validateStructure(story), engine: "anthropic", model, mode: "benchmark" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 분석 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
