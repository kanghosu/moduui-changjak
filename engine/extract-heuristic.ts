import type { ExtractedElements } from "./creation";

// 키 없이도 데모가 돌도록 하는 폴백 추출기.
// LLM을 대체하지는 못하지만, 한국어에서 흔한 표현은 잡아내 "이미 말한 걸 다시 묻는" 실패를 줄인다.
// (2026-08-25: 주인공을 말했는데도 되묻는 문제가 실사용 검증에서 발견되어 보강)
export interface HeuristicOptions {
  /** 발화에 실제로 등장하는 라이브러리 작품명을 찾아주는 함수 (없으면 벤치마크 추출을 건너뛴다) */
  readonly findBenchmark?: (text: string) => string | undefined;
}

export function heuristicExtract(utterance: string, opts: HeuristicOptions = {}): ExtractedElements {
  const el: ExtractedElements = {};
  const text = utterance.replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  const find = (re: RegExp) => sentences.find((x) => re.test(x));
  const cap = (m: RegExpMatchArray | null, i = 1) => {
    const v = m?.[i]?.trim().replace(/[,.!?"'’”]+$/, "");
    return v && v.length >= 2 ? v : undefined;
  };

  // 인상적인 장면 — 장면을 언급한 문장을 통째로 살린다 (내용을 잘라먹지 않는 것이 핵심)
  const sceneSent = find(/장면|씬|이미지가|그림이/) || find(/꿈에서|꿈 ?속/);
  if (sceneSent) {
    const idx = sentences.indexOf(sceneSent);
    const next = sentences[idx + 1];
    el.scene = next && /인데|건데|장면|거기서|주인공|그때/.test(next) ? sceneSent + " " + next : sceneSent;
  }

  // 주인공 — "주인공은 X", "X인 주인공"
  const heroDesc =
    cap(text.match(/주인공은\s*([^.!?]{2,40}?)(?:이었으면|였으면|이면|이고|이다|입니다|예요|이에요|[.!?]|$)/)) ||
    cap(text.match(/([^\s.!?]{2,20}(?:인|한|의))\s*주인공/)) ||
    cap(text.match(/주인공(?:이|으로)\s*([^.!?]{2,30}?)(?:이었|였|으로|[.!?]|$)/));
  if (heroDesc && !/어떤|누구|잘 모르|모르겠/.test(heroDesc)) el.heroDesc = heroDesc;

  // 사건·소재
  const premise =
    cap(text.match(/([^.!?]{4,40})(?:하는|라는)\s*(?:사건|이야기|내용)/)) ||
    cap(text.match(/(?:소재는|사건은)\s*([^.!?]{2,40})/));
  if (premise) el.premise = premise;

  // 주제
  const theme = cap(text.match(/([^.!?]{2,30})(?:에 관한|에 대한)\s*(?:이야기|것)/));
  if (theme) el.theme = theme;

  // 결말
  const ending =
    cap(text.match(/(?:결말은|끝은|마지막은)\s*([^.!?]{2,40})/)) ||
    cap(text.match(/([^.!?]{2,30})(?:로|으로)\s*(?:끝났으면|끝나면|마무리)/));
  if (ending) el.ending = ending;

  // 시대·배경
  const era = cap(text.match(/(\d{2,4}년대?|조선\s*시대|고려\s*시대|근미래|일제\s*강점기)/));
  if (era) el.era = era;

  const GENRE_HINTS: [RegExp, string][] = [
    [/복수/, "복수극"], [/코미디|유쾌|웃긴/, "코미디"], [/스릴러|긴장/, "스릴러"],
    [/로맨스|사랑|연애/, "로맨스"], [/공포|호러/, "공포"], [/판타지|마법/, "판타지"],
    [/SF|우주|미래/, "SF"], [/드라마/, "드라마"],
  ];
  for (const [re, g] of GENRE_HINTS) if (!el.genre && re.test(text)) el.genre = g;

  const TONE_HINTS: [RegExp, string][] = [
    [/유쾌[^.!?]*통쾌|통쾌[^.!?]*유쾌/, "유쾌하고 통쾌한"], [/통쾌/, "통쾌한"], [/유쾌/, "유쾌한"],
    [/비장|묵직|무겁/, "비장한"], [/따뜻|잔잔/, "따뜻하고 잔잔한"], [/어둡|암울/, "어두운"],
  ];
  for (const [re, t] of TONE_HINTS) if (!el.tone && re.test(text)) el.tone = t;

  // 참고 영화 — 라이브러리 제목이 발화에 실제로 등장할 때만
  const benchmark = opts.findBenchmark?.(text);
  if (benchmark) el.benchmark = benchmark;

  return el;
}

