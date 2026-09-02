// 아이디어 → 유사 벤치마크 매칭 휴리스틱.
// /api/match와 /api/loglines(mock 폴백)가 공유한다. 기존 /api/match 로직을 그대로 옮김.

import type { Story } from "./schema";
import libraryRaw from "./benchmark-library.json";

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

export interface BenchmarkMatch {
  title: string;
  year?: string;
  keyword?: string;
  logline: string;
  score: number;
  matched: string[];
}

// 전체 점수표 (내림차순). anyHit=false면 top[0].score===0.
export function scoreBenchmarks(idea: string): BenchmarkMatch[] {
  const tokens = tokenize(idea);
  const blobs = LIBRARY.map((s) => ({ s, blob: textOf(s) }));

  const scores = blobs.map(({ s, blob }) => {
    let score = 0;
    const matched: string[] = [];
    for (const t of tokens) {
      if (blob.includes(t)) {
        score += 2;
        if (matched.length < 6) matched.push(t);
      }
      const boosted = BOOST[t];
      if (boosted?.some((title) => title === s.title)) {
        score += 5;
        if (!matched.includes(t) && matched.length < 6) matched.push(t);
      }
    }
    for (const t of tokens) {
      if ((s.title || "").toLowerCase().includes(t)) score += 4;
      if ((s.keyword || "").toLowerCase().includes(t)) score += 3;
    }
    return {
      title: s.title || "", year: s.year, keyword: s.keyword,
      logline: (s.fourActLogline || s.logline || "").slice(0, 140),
      score, matched,
    };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

// top 3 (매치 없으면 대표작 폴백)
export function matchBenchmarks(idea: string): { matches: BenchmarkMatch[]; anyHit: boolean } {
  const scores = scoreBenchmarks(idea);
  const top = scores.slice(0, 3);
  const anyHit = (top[0]?.score ?? 0) > 0;
  if (anyHit) return { matches: top, anyHit };
  const fallback = ["기생충", "명량", "극한직업"]
    .map((t) => scores.find((x) => x.title === t))
    .filter((x): x is BenchmarkMatch => Boolean(x));
  return { matches: fallback, anyHit };
}

export function libraryTitles(): string[] {
  return LIBRARY.map((s) => s.title || "").filter(Boolean);
}
