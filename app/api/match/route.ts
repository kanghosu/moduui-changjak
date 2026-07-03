import { NextRequest, NextResponse } from "next/server";
import type { Story } from "@/engine/schema";
import libraryRaw from "@/engine/benchmark-library.json";

export const runtime = "nodejs";

const LIBRARY = libraryRaw as unknown as Story[];

// 장르·소재 키워드 → 어울리는 벤치마크 (거장 라이브러리 기준 부스트 테이블)
const BOOST: Record<string, string[]> = {
  가족: ["국제시장", "칠번방의선물", "기생충", "괴물", "신과 함께 - 죄와 벌"],
  아버지: ["국제시장", "칠번방의선물", "괴물", "인터스텔라"],
  딸: ["칠번방의선물", "괴물", "인터스텔라"],
  재난: ["해운대", "부산행", "괴물", "태극기 휘날리며"],
  좀비: ["부산행"],
  바이러스: ["부산행", "괴물"],
  복수: ["베테랑", "암살", "명량"],
  정의: ["베테랑", "변호인 : 작가입장에서의 분석", "택시운전사"],
  법정: ["변호인 : 작가입장에서의 분석", "칠번방의선물"],
  잠입: ["극한직업", "암살", "기생충"],
  언더커버: ["극한직업", "암살"],
  경찰: ["극한직업", "베테랑"],
  형사: ["극한직업", "베테랑"],
  코미디: ["극한직업", "도둑들", "광해"],
  사기: ["기생충", "도둑들", "<광해, 왕이 된 남자>"],
  신분: ["기생충", "<광해, 왕이 된 남자>", "왕의 남자"],
  가난: ["기생충", "국제시장", "칠번방의선물"],
  부자: ["기생충", "베테랑"],
  계급: ["기생충", "베테랑", "왕의 남자"],
  사극: ["명량", "<광해, 왕이 된 남자>", "왕의 남자", "암살"],
  역사: ["명량", "암살", "택시운전사", "태극기 휘날리며", "국제시장"],
  전쟁: ["명량", "태극기 휘날리며", "아바타"],
  왕: ["<광해, 왕이 된 남자>", "왕의 남자", "명량"],
  독립: ["암살"],
  일제: ["암살"],
  기자: ["택시운전사"],
  민주: ["택시운전사", "변호인 : 작가입장에서의 분석"],
  우주: ["인터스텔라", "어벤져스04엔드게임"],
  시간: ["인터스텔라", "어벤져스04엔드게임"],
  히어로: ["어벤져스04엔드게임", "어벤져스 [인피니티 워]"],
  능력: ["어벤져스04엔드게임", "아바타", "겨울왕국1"],
  판타지: ["아바타", "겨울왕국1", "겨울왕국2", "신과 함께 - 죄와 벌"],
  마법: ["겨울왕국1", "겨울왕국2"],
  자매: ["겨울왕국1", "겨울왕국2"],
  형제: ["태극기 휘날리며", "신과 함께 - 죄와 벌"],
  괴물: ["괴물", "부산행"],
  저승: ["신과 함께 - 죄와 벌"],
  죽음: ["신과 함께 - 죄와 벌", "부산행", "태극기 휘날리며"],
  도둑: ["도둑들"],
  범죄: ["도둑들", "베테랑", "극한직업", "암살"],
  광대: ["왕의 남자"],
  예술: ["왕의 남자"],
  로맨스: ["겨울왕국1", "왕의 남자", "아바타"],
  사랑: ["해운대", "아바타", "왕의 남자"],
  환경: ["아바타", "괴물"],
  이민: ["국제시장"],
  희생: ["명량", "인터스텔라", "태극기 휘날리며", "어벤져스04엔드게임"],
};

function textOf(s: Story): string {
  return [
    s.title, s.keyword, s.genre, s.logline, s.fourActLogline, s.takeaway,
    ...s.blocks.map((b) => `${b.subtitle || ""} ${b.summary || ""}`),
  ].join(" ").toLowerCase();
}

function tokenize(idea: string): string[] {
  return Array.from(new Set(
    idea.toLowerCase()
      .split(/[\s,.\/!?~()'"‘’“”·…-]+/)
      .flatMap((w) => {
        // 조사 대략 제거 (2글자 이상 어근 확보)
        const stripped = w.replace(/(은|는|이|가|을|를|의|에|에서|으로|로|와|과|도|만|이다|다)$/u, "");
        return [w, stripped];
      })
      .filter((w) => w.length >= 2)
  ));
}

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

  const tokens = tokenize(idea);
  const blobs = LIBRARY.map((s) => ({ s, blob: textOf(s) }));

  const scores = blobs.map(({ s, blob }) => {
    let score = 0;
    const matched: string[] = [];
    for (const t of tokens) {
      // 본문 출현
      if (blob.includes(t)) {
        score += 2;
        if (matched.length < 6) matched.push(t);
      }
      // 부스트 테이블
      const boosted = BOOST[t];
      if (boosted?.some((title) => title === s.title)) {
        score += 5;
        if (!matched.includes(t) && matched.length < 6) matched.push(t);
      }
    }
    // 제목·키워드 직접 매치 가중
    for (const t of tokens) {
      if ((s.title || "").toLowerCase().includes(t)) score += 4;
      if ((s.keyword || "").toLowerCase().includes(t)) score += 3;
    }
    return { title: s.title, year: s.year, keyword: s.keyword, logline: (s.fourActLogline || s.logline || "").slice(0, 140), score, matched };
  });

  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 3);
  const anyHit = top[0]?.score > 0;

  // 매치가 전혀 없으면 대표작 3편 (장르 다양성)
  const fallback = ["기생충", "명량", "극한직업"]
    .map((t) => scores.find((x) => x.title === t))
    .filter(Boolean);

  return NextResponse.json({
    matches: anyHit ? top : fallback,
    method: "heuristic",
    note: anyHit
      ? "거장 확정 라이브러리 23편에서 소재·장르 신호로 매칭했어요."
      : "딱 맞는 작품을 못 찾아 대표작을 추천해요. ANTHROPIC_API_KEY 연결 시 AI가 더 정밀하게 매칭합니다.",
  });
}
