import { NextRequest, NextResponse } from "next/server";
import { matchBenchmarks } from "@/engine/matcher";

export const runtime = "nodejs";

// POST { idea } → 유사 벤치마크 top 3 + 매치 근거
export async function POST(req: NextRequest) {
  let body: { idea?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const idea = body?.idea?.trim();
  if (!idea) return NextResponse.json({ error: "쓰고 싶은 이야기를 한두 줄 적어주세요." }, { status: 400 });

  const { matches, anyHit } = matchBenchmarks(idea);

  return NextResponse.json({
    matches,
    method: "heuristic",
    note: anyHit
      ? "거장 확정 라이브러리 24편에서 소재·장르 신호로 매칭했어요."
      : "딱 맞는 작품을 못 찾아 대표작을 추천해요. ANTHROPIC_API_KEY 연결 시 AI가 더 정밀하게 매칭합니다.",
  });
}
