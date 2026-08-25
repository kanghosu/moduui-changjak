export type SceneBlockDefinition = {
  readonly index: number;
  readonly act: 1 | 2 | 3 | 4;
  readonly function: string;
  readonly keywords: readonly string[];
};

export type SceneCandidate = {
  readonly index: number;
  readonly act: 1 | 2 | 3 | 4;
  readonly function: string;
  readonly reason: string;
};

const BLOCK_HINTS = [
  [],
  ["오프닝", "프롤로그", "처음", "현재", "일상", "시작"],
  ["소개", "평온", "일상", "결핍", "부족"],
  ["결핍", "해소", "노력", "일상", "버티"],
  ["도입", "사건", "사고", "만남", "휘말", "발생"],
  ["혼란", "딜레마", "후유증", "망설", "갈등"],
  ["해소", "출발", "계기", "준비", "구성"],
  ["결정", "진입", "출발", "욕망", "떠나", "시작"],
  ["시험", "동료", "만남", "동행", "b-story", "자격"],
  ["악마", "적", "위협", "추적", "공격", "장애"],
  ["조력", "합류", "친구", "동료", "참여"],
  ["성취", "승리", "성공", "기대", "하이라이트", "해결"],
  ["위기", "좌절", "실패", "무너", "상실", "오판"],
  ["전환", "반전", "진실", "발견", "깨닫", "변화", "결심", "180"],
  ["본색", "정체", "악화", "드러", "배신", "적"],
  ["관계", "동맹", "친구", "사랑", "급진", "b-story"],
  ["준비", "총력", "작전", "의기투합", "반격"],
  ["패배", "역부족", "실망", "긴장", "실패", "좌절"],
  ["상실", "죽음", "잃", "절망", "피크", "최악", "분노"],
  ["결단", "각오", "죽기를", "도약", "일어", "복수"],
  ["결전", "대결", "싸움", "반격", "추격", "준비"],
  ["최악", "죽음", "위기", "마지막", "후회"],
  ["클라이맥스", "보상", "희생", "구원", "기적", "축복"],
  ["결말", "진실", "해소", "정착", "밝혀"],
  ["에필로그", "새로운", "일상", "출발", "끝", "후일"],
] as const;

const PARTICLES = ["에서", "에게", "으로", "처럼", "까지", "부터", "보다", "을", "를", "은", "는", "이", "가", "에", "로", "와", "과", "도", "만", "의"];
const STOP_TOKENS = new Set(["주인공", "이야기", "영화", "장면", "사람", "자신", "것", "그리고", "대한", "통해", "위해"]);

function clean(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/\*\*|`/g, "").replace(/\s+/g, " ").trim();
}

function compact(value: string): string {
  return clean(value).replace(/[\s()[\]{}.,:;"'·<>/!?_-]/g, "");
}

function withoutParticle(value: string): string {
  const particle = PARTICLES.find((candidate) => value.endsWith(candidate) && value.length - candidate.length >= 2);
  return particle ? value.slice(0, -particle.length) : value;
}

function tokenize(value: string): readonly string[] {
  const words = clean(value).match(/[가-힣]{2,}|[a-z0-9]{2,}/g) ?? [];
  return [...new Set(words.flatMap((word) => [word, withoutParticle(word)]).filter((word) => !STOP_TOKENS.has(word)))];
}

function blockAct(index: number): 1 | 2 | 3 | 4 {
  if (index <= 6) return 1;
  if (index <= 12) return 2;
  if (index <= 18) return 3;
  return 4;
}

function hintsFor(index: number): readonly string[] {
  return BLOCK_HINTS[index] ?? [];
}

export function parseBlockDefinitions(markdown: string): readonly SceneBlockDefinition[] {
  const definitions = markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+)\|/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => {
      const index = Number(match[1]);
      const functionName = clean(match[3]);
      return { index, act: blockAct(index), function: functionName, keywords: [...hintsFor(index), ...tokenize(functionName)] };
    })
    .filter((definition) => definition.index >= 1 && definition.index <= 24);

  if (definitions.length === 24) return definitions;
  return Array.from({ length: 24 }, (_, offset) => {
    const index = offset + 1;
    return { index, act: blockAct(index), function: `블록 ${index}`, keywords: hintsFor(index) };
  });
}

type ScoredCandidate = SceneCandidate & { readonly score: number; readonly matched: readonly string[] };

function scoreDefinition(scene: string, sceneTokens: readonly string[], definition: SceneBlockDefinition): ScoredCandidate {
  const sceneCompact = compact(scene);
  const matched = [...new Set(definition.keywords.filter((keyword) => !STOP_TOKENS.has(compact(keyword)) && sceneCompact.includes(compact(keyword))))];
  const tokenMatches = sceneTokens.filter((token) => definition.keywords.some((keyword) => compact(keyword).includes(compact(token))));
  const score = matched.length * 3 + tokenMatches.length;
  const visibleMatches = [...new Set([...matched, ...tokenMatches])].filter((value) => value.length >= 2).slice(0, 3);
  const reason = visibleMatches.length > 0
    ? `장면의 '${visibleMatches.join("', '")}' 단서가 ${definition.function} 기능과 맞습니다.`
    : `직접 일치 단서는 적지만 ${definition.function} 단계에서 장면의 위치를 검토할 수 있습니다.`;
  return { index: definition.index, act: definition.act, function: definition.function, reason, score, matched: visibleMatches };
}

export function inferSceneBlocks(sceneText: string, markdown: string): readonly SceneCandidate[] {
  const definitions = parseBlockDefinitions(markdown);
  const sceneTokens = tokenize(sceneText);
  const scored = definitions
    .map((definition) => scoreDefinition(sceneText, sceneTokens, definition))
    .sort((left, right) => right.score - left.score || left.index - right.index)
  const positive = scored.filter((candidate) => candidate.score > 0);
  const selected = positive.length >= 3 ? positive.slice(0, 4) : [...positive, ...scored.filter((candidate) => candidate.score === 0)].slice(0, 3);

  return selected.map(({ score: _score, matched: _matched, ...candidate }) => candidate);
}
