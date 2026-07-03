# AI 벤치마크 라이브러리 작성 규격 (에이전트용)

실존 흥행 영화 1편을 김태원 「욕망의 레시피」 4막·24블록 구조로 분석해, 아래 스키마의 **JSON 파일 하나**로 저장한다.

## 절대 규칙
- 실제 영화의 실제 줄거리로만 채운다. 모르는 부분을 임의 창작하지 말고, 가장 널리 알려진 줄거리에 근거한다.
- blocks는 **정확히 24개** (index 1~24). act는 1~6→1, 7~12→2, 13~18→3, 19~24→4.
- block 13에 `"isReversal": true` (전환점 — 즉자적 욕망→대자적 욕망 180도 전환. "내가 진정 바라는 바는?").
- block 9, 14, 18에 `"antagonistEscalation": true` (악마의 발톱 → 본색 → 잔인무도 절정).
- block 8, 15, 22에 `"bStory": true` (B스토리 시작 → 급진전 → 예기치 않은 보상).
- characters: 실제 인물명 사용. protagonist 1명 필수 + antagonist 1명 필수 + ally/supporting 1~2명.
  - protagonist의 want = 즉자적 욕망(표면 목표, 이 영화에서 구체적으로), need = 대자적 욕망(근본 결핍), arc = 즉자→전환점→대자 변화를 이 영화 내용으로.
- 한국어로 작성. summary는 2~4문장, subtitle은 그 블록의 에피소드 소제목(6~14자).

## 24블록 기능(function) 정본 — 이 문구를 그대로 function에 쓰고, 영화 내용은 subtitle/summary에
1 오프닝 이벤트 / 2 주인공의 소개(1) 평온한 일상 속 결핍 / 3 주인공의 소개(2) 결핍 해소의 소극적 노력 / 4 도입 이벤트 (휘말림) / 5 이벤트의 후유증 (혼란·딜레마) / 6 후유증의 일시적 해소 → 시작점 구성 / 7 시작점 — 새로운 세계로 진입 ("그래, 한번 해보자!") / 8 주인공의 자격 시험 + B스토리 시작 / 9 악마의 발톱 (콘타고니스트 등장) / 10 C스토리 조력자들 참여 / 11 즉자적 욕망이 성취될 듯한 분위기 / 12 패배·좌절·상실 ▶ 위기(1) / 13 전환점 — 운명의 전환, 진실의 발견 / 14 악마의 전면 등장 (안타고니스트 본색) / 15 B스토리 관계 급진전 / 16 총력 투쟁(1) 의기투합·승리 기대 / 17 총력 투쟁(2) 역부족·패배 예감 / 18 패배·좌절·상실 ▶ 위기(2) — 소중한 것의 상실, 분노 절정 / 19 피크점 — 최후의 선택 ("죽기를 각오하고") / 20 이판사판 결사항전 / 21 치명적 위기(3) / 22 예기치 않았던 보상과 축복 — 클라이맥스 / 23 결말 — 욕망의 성취 / 24 에필로그 + 속편 암시

## JSON 스키마 (파일 = 이 객체 하나)
```json
{
  "title": "영화 제목(정식 한국 개봉명)",
  "key": "파일 슬러그와 동일",
  "year": "2015",
  "keyword": "핵심키워드(6자 이내)",
  "genre": "장르",
  "origin": "ai",
  "logline": "한 줄 로그라인 — [주인공]이 [욕망]을 위해 [행동]하지만 [갈등]에 부딪혀 [결단]하는 이야기 형태",
  "premise": "소재/사건 한 줄",
  "target": "주 타깃 관객",
  "tone": "톤",
  "fourActLogline": "1막: … / 2막: … / 3막: … / 4막: … (네 문장, 즉자→대자 전환이 드러나게)",
  "takeaway": "착안점 — 이 영화 구조의 장르적 특징·교훈, 내 이야기에 응용하는 법 (3~5문장)",
  "directorNote": "감독의 기법 — 연출·시점·편집·상징 등 이 감독 고유의 스토리텔링 기법 3~5가지를 작가가 참고할 수 있게 (예: 봉준호의 계단 상징, 놀란의 교차 편집)",
  "reversalPointIndex": 13,
  "characters": [
    {"id":"protagonist","name":"실명","role":"protagonist","want":"즉자적 욕망(구체적)","need":"대자적 욕망(구체적)","arc":"즉자→(전환점)→대자 변화 요약"},
    {"id":"antagonist","name":"실명","role":"antagonist","want":"…","need":"…","arc":"발톱(9)→본색(14)→절정(18) 상승 요약"},
    {"id":"ally","name":"실명","role":"ally","want":"…","need":"…","arc":"B스토리(8→15→22) 요약"}
  ],
  "blocks": [
    {"index":1,"act":1,"function":"오프닝 이벤트","subtitle":"소제목","summary":"실제 줄거리 2~4문장"},
    {"index":13,"act":3,"function":"전환점 — 운명의 전환, 진실의 발견","subtitle":"…","summary":"…","isReversal":true}
  ],
  "notes": ["[AI 분석 라이브러리] 4막·24블록 자동 분석 — 거장 확정본이 아닌 참고용."]
}
```

## 저장 후 자기 검증 (반드시)
Bash로 실행해 OK 확인:
`node -e "const s=require('<절대경로>');if(s.blocks.length!==24)throw'blocks '+s.blocks.length;if(!s.blocks[12].isReversal)throw'no reversal';[9,14,18].forEach(i=>{if(!s.blocks[i-1].antagonistEscalation)throw'esc '+i});[8,15,22].forEach(i=>{if(!s.blocks[i-1].bStory)throw'bstory '+i});if(!s.characters.some(c=>c.role==='antagonist'))throw'no antagonist';console.log('OK',s.title)"`
