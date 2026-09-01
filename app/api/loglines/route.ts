import { NextRequest, NextResponse } from "next/server";
import { isFallbackWorthy, makeAnthropicClient } from "@/engine/anthropic-client";
import { callModelJson } from "@/engine/anthropic-call";
import { normalizeElements, type ExtractedElements, type LoglineOption } from "@/engine/creation";
import { matchBenchmarks, libraryTitles } from "@/engine/matcher";
import { MODEL_MAIN } from "@/engine/models";
import { checkDailyGuard, checkGuard } from "@/engine/guard";

export const runtime = "nodejs";

// 키 없을 때: 템플릿 + 휴리스틱 벤치마크로 3안 골격 생성
function mockLoglines(utterance: string, el: ExtractedElements): LoglineOption[] {
  const hero = el.heroDesc?.value || el.heroName?.value || "평범한 주인공";
  const event = el.premise?.value || el.scene?.value || "뜻밖의 사건";
  const goal = el.theme?.value || el.ending?.value || "진짜 원하는 것";
  const elementText = Object.values(el).map((element) => element?.value || "").join(" ");
  const { matches } = matchBenchmarks([utterance, elementText].join(" "));
  const bm = (i: number) => matches[i % Math.max(matches.length, 1)]?.title || "기생충";

  return [
    {
      logline: `${hero}이(가) ${event}에 정면으로 뛰어들며, ${goal}이 무엇인지 깨닫는 이야기`,
      premise: event,
      direction: "정공법 — 목표를 향해 부딪히는",
      benchmarkTitle: bm(0),
      reason: "소재·장르 신호가 가장 가까운 작품이에요. (mock 골격 — 키 연결 시 AI가 정밀하게 제안합니다)",
    },
    {
      logline: `${hero}이(가) ${event} 속에서 뜻밖의 인연을 만나고, 그 관계를 통해 ${goal}을 깨닫는 이야기`,
      premise: event,
      direction: "관계 중심 — 사람을 통해 변하는",
      benchmarkTitle: bm(1),
      reason: "관계선(B스토리)을 축으로 변주한 방향이에요.",
    },
    {
      logline: `${hero}이(가) ${event}에서 원하던 것을 손에 넣지만, 정작 ${goal}은 다른 곳에 있었음을 깨닫는 이야기`,
      premise: event,
      direction: "아이러니 — 얻고 나서야 잃은 것을 아는",
      benchmarkTitle: bm(2),
      reason: "기대와 반전(전환점)을 강조한 방향이에요.",
    },
  ];
}

// POST { utterance, elements } → { options: LoglineOption[3], engine }
export async function POST(req: NextRequest) {
  let body: { utterance?: string; elements?: ExtractedElements };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }
  const guard = await checkGuard(req, (JSON.stringify(body) ?? "").length, { consumeDaily: false });
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });
  const utterance = body?.utterance?.trim() || "";
  const elements = normalizeElements(body?.elements);
  if (!utterance && Object.keys(elements).length === 0) {
    return NextResponse.json({ error: "발화 또는 추출 요소가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    if (!apiKey) {
      return NextResponse.json({ options: mockLoglines(utterance, elements), engine: "mock" });
    }

    const model = MODEL_MAIN;
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = makeAnthropicClient(apiKey);

    const titles = libraryTitles();
    const system = [
      "너는 '욕망의 레시피'(4막 24블록) 방법론 기반 스토리 코치다. 사용자의 발화·추출 요소로 서로 다른 방향의 로그라인 3안을 제안한다.",
      "로그라인 형식(사맥): '이러이러했던 주인공이 / 이러이러한 사건을 겪으면서 / 이러이러한 것을 깨닫는 이야기' — 출발점과 결말(깨달음)이 반드시 들어간다.",
      "3안은 갈등·결말 방향이 서로 달라야 한다 (예: 정공법 / 관계 중심 / 아이러니).",
      "benchmarkTitle은 반드시 아래 목록에 실존하는 제목 그대로 하나를 고른다:",
      titles.join(" | "),
      "사용자의 요소를 우선하고, 없는 설정을 과도하게 지어내지 않는다. 사용자 표현을 살린다.",
      "반드시 JSON 객체 하나만 출력한다. 코드펜스·설명 금지. 스키마:",
      `{"options": [{"logline": string, "premise": string, "direction": string, "benchmarkTitle": string, "reason": string}, ...3개]}`,
    ].join("\n");

    const userMsg = JSON.stringify({ utterance, elements });

    const dailyGuard = await checkDailyGuard(req);
    if (!dailyGuard.ok) return NextResponse.json({ error: dailyGuard.message }, { status: dailyGuard.status });
    try {
      const called = await callModelJson<{ options?: LoglineOption[] }>(client, model, {
        system, user: userMsg, maxTokens: 2000,
      });
      const parsed = called.data;

      let options = Array.isArray(parsed.options) ? parsed.options.slice(0, 3) : [];
      // 벤치마크가 목록에 없으면 휴리스틱으로 보정
      const titleSet = new Set(titles);
      options = options.map((o) => ({
        ...o,
        benchmarkTitle: titleSet.has(o.benchmarkTitle)
          ? o.benchmarkTitle
          : matchBenchmarks(o.logline || utterance).matches[0]?.title || "기생충",
      }));
      if (options.length < 3) options = [...options, ...mockLoglines(utterance, elements)].slice(0, 3);

      return NextResponse.json({ options, engine: "anthropic", model: called.modelUsed, fellBack: called.fellBack });
    } catch (error) {
      if (!isFallbackWorthy(error)) {
        return NextResponse.json({ error: "로그라인 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
      }
      const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : undefined;
      const message = error instanceof Error ? error.message : "알 수 없는 Anthropic 오류";
      console.error("[AI fallback]", "loglines", status, message);
      // checkDailyGuard가 호출 직전에 올린 카운터는 호출 실패 후에도 시도 비용으로 유지한다.
      return NextResponse.json({ options: mockLoglines(utterance, elements), engine: "mock", fallbackFrom: "anthropic" });
    }
  } catch {
    return NextResponse.json({ error: "로그라인 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
