import { NextRequest, NextResponse } from "next/server";
import { buildRequestParams, refusalOf } from "@/engine/model-capabilities";
import { promises as fs } from "fs";
import path from "path";
import type { Story } from "@/engine/schema";
import libraryRaw from "@/engine/benchmark-library.json";

export const runtime = "nodejs";

const LIBRARY = libraryRaw as unknown as Story[];

// 24블록 ↔ Save the Cat 대응 (masters-crosswalk.md 요약 앵커)
const STC: Record<number, string> = {
  1: "Opening Image", 4: "Catalyst (p.12≈11%)", 7: "Break into Two (23%)", 8: "B Story (27%)",
  11: "Fun & Games 정점", 13: "Midpoint (50%) — false victory/defeat", 14: "Bad Guys Close In",
  18: "All Is Lost (68%) + whiff of death", 19: "Break into Three", 22: "Finale 승리", 24: "Final Image (블록 1과 대구)",
};

function normT(s: string) { return (s || "").replace(/[\s<>:,·\[\]()「」'".\-]/g, "").toLowerCase(); }

interface Suggestion { label: string; source: string; text: string; draft: string }

// POST { index, benchmarkName?, logline?, genre? } → 제안 3카드
export async function POST(req: NextRequest) {
  let body: { index?: number; benchmarkName?: string; logline?: string; genre?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const index = Number(body?.index);
  if (!index || index < 1 || index > 24) return NextResponse.json({ error: "블록 번호(1~24)가 필요합니다." }, { status: 400 });

  const bench = body.benchmarkName
    ? LIBRARY.find((s) => normT(s.title || "").includes(normT(body.benchmarkName!)) || normT(body.benchmarkName!).includes(normT(s.title || "")))
    : undefined;
  const bb = bench?.blocks[index - 1];

  // 장르 지침 로드
  let genreLine = "";
  let genreName = "";
  try {
    const g = JSON.parse(await fs.readFile(path.join(process.cwd(), "knowledge/method/genre-guidelines.json"), "utf8")) as Record<string, Record<string, string>>;
    const genre = body.genre || "";
    const key = /로맨스|버디|코미디/.test(genre) ? "로맨스/버디" : /스릴러|재난|공포/.test(genre) ? "스릴러" : /미스터리|추리|수사/.test(genre) ? "미스터리" : "";
    if (key && g[key]?.[String(index)]) { genreLine = g[key][String(index)]; genreName = key; }
  } catch { /* 지침 없으면 생략 */ }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── 키 있으면: AI가 실제 사건 3안 생성 ──
  if (apiKey && bb) {
    try {
      const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
      const resp = await client.messages.create({
        model, ...buildRequestParams(model!, { maxTokens: 1200 }),
        system: `너는 욕망의 레시피 작법 코치다. 블록 ${index}(${bb.function})의 사건 후보 3개를 JSON으로만 출력: {"suggestions":[{"label":"...","text":"...","draft":"2~3문장 사건"}]}. 벤치마크(${bench!.title})의 같은 블록: ${bb.subtitle} / ${(bb.summary || "").slice(0, 200)}. 구조 기능은 지키되 소재는 사용자 로그라인을 따를 것.`,
        messages: [{ role: "user", content: `로그라인: ${body.logline || ""} / 장르: ${body.genre || ""}${genreLine ? ` / 장르지침: ${genreLine}` : ""}` }],
      });
      // 안전 분류기가 거부하면 HTTP 200에 stop_reason="refusal"이 온다.
      // 확인하지 않으면 빈 content를 정상 응답으로 착각해 파싱 오류로 둔갑한다.
      const _refusal = refusalOf(resp);
      if (_refusal.refused) throw new Error(`모델이 요청을 거부했습니다${_refusal.category ? ` (${_refusal.category})` : ""}.`);
      const text = resp.content.filter((b): b is { type: "text"; text: string } => b.type === "text").map((b) => b.text).join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      return NextResponse.json({ suggestions: parsed.suggestions?.slice(0, 3) ?? [], engine: "anthropic" });
    } catch { /* 폴백으로 진행 */ }
  }

  // ── 키 없으면: 실데이터 기반 코칭 카드 3장 (거장 벤치마크 + 장르 지침 + 세계 표준) ──
  const suggestions: Suggestion[] = [];
  if (bb) {
    suggestions.push({
      label: "기계적 대입",
      source: `${bench!.title} · 거장 확정`,
      text: `벤치마크의 이 블록: 「${bb.subtitle || bb.function}」 — ${(bb.summary || "").slice(0, 120)}`,
      draft: `(${bb.subtitle || bb.function})의 자리에 내 인물·공간을 넣으면: `,
    });
    suggestions.push({
      label: "창조적 변주",
      source: "벤치마크 뼈대 유지 · 결만 반전",
      text: `같은 기능, 반대 결 — 「${bb.subtitle || "이 사건"}」에서 공간·관계·성별·시대 중 하나만 뒤집어 보세요. 뼈대(${bb.function.split("—")[0].trim()})는 흔들리지 않게.`,
      draft: `벤치마크와 반대로, 내 이야기에서는 `,
    });
  }
  if (genreLine) {
    suggestions.push({
      label: `장르 지침 (${genreName})`,
      source: "김태원 템플릿 원본",
      text: genreLine,
      draft: "",
    });
  } else {
    suggestions.push({
      label: "세계 표준 체크",
      source: "거장 교차표",
      text: STC[index] ? `이 블록은 세계 작법의 「${STC[index]}」에 해당 — 그 강도가 나오고 있나요?` : `이 블록의 기능이 앞뒤 블록과 인과로 이어지는지 확인하세요.`,
      draft: "",
    });
  }
  return NextResponse.json({
    suggestions: suggestions.slice(0, 3),
    engine: "coach",
    note: "ANTHROPIC_API_KEY 연결 시 내 소재로 쓴 실제 사건 3안이 생성됩니다.",
  });
}
