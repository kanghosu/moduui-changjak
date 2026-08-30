# knowledge 설계문서

> 이 문서는 코드의 현재 동작을 복사하지 않고, docs/PRD_v3.md가 의도한 개념·벤치마크·영화 조회 기능을 적는다.

| 항목 | 값 |
|---|---|
| 기능 ID | knowledge |
| 작성 | W4 / 2026-08-30 |
| 근거 문서 | docs/PRD_v3.md §2, §3, §4, §6-1, §7, §12-5 |
| 상태 | 초안 |

---

## 0. Context Anchor

| Key | Value |
|---|---|
| **WHY** | 사용자의 아이디어가 참고할 수 있는 영화 구조와 방법론 개념을 제공한다. 서비스 런타임 지식은 영화 24+76편과 방법론·개념팩으로 구성한다(§6-1). |
| **WHO** | 좋아하는 영화에서 시작하려는 신인 창작자, 작품의 닮은 뼈대를 찾으려는 창작 입문자, 구조 표기를 검수하는 내부 검수자 |
| **RISK** | 검수된 기준 작품과 AI 분석 초안을 섞거나, 확인되지 않은 AI 분석을 검증된 결과로 보이면 P2 정직한 표기와 사용자의 판단을 훼손한다. |
| **SUCCESS** | 사용자가 영화 제목 또는 아이디어를 입력해 참고할 구조를 찾고, 기준 24편과 AI 분석 초안 76편을 출처 상태가 보이는 채로 구분해 선택한다. |
| **SCOPE** | 방법론 개념 도움말, 영화 라이브러리 목록·검색, 4막·24블록 벤치마크 조회, 아이디어와 참고 작품의 연결까지다. 작품 생성·사용자 프로젝트 저장은 범위 밖이다. |

## 1. 기능 요구사항

| ID | 요구사항 | PRD 근거 | 우선순위 |
|---|---|---|---|
| R1 | 서비스 런타임 지식이 로드되면 거장 확정 기준 24편과 AI 분석 초안 76편을 서로 다른 출처 상태로 제공한다 | §6-1, §3-1 P2 | P0 |
| R2 | 사용자가 기준 영화 또는 참고 영화를 선택하면 4막·24블록 구조를 참고할 수 있는 상세 결과를 제공한다 | §1, §4, §6-1 | P1 |
| R3 | 조회 결과의 근거가 AI 분석 초안이면 검수 완료나 거장 확정으로 표시하지 않고 AI 분석 초안임을 함께 표시한다 | §3-1 P2, §4 대외 표기 규칙 | P0 |
| R4 | 사용자가 자신의 아이디어를 입력하면 그 아이디어와 닮은 벤치마크 후보를 비교·선택할 수 있게 한다 | §7의 경쟁에서 확인되지 않은 기회 3, §10 무료 구간 | P1 |
| R5 | 실제 모델 경로가 검증되지 않은 상태에서는 현재 휴리스틱·mock 결과를 AI 성능의 증거로 제시하지 않는다 | §4, §11 데모 범위와 대가 | P0 |
| R6 | 구조 결과를 검수할 때 24블록 수, 중심 전환점, 적대자 상승, B스토리, 인물 역할의 상태를 확인할 수 있게 한다 | §4, §12-5 | P1 |
| R7 | 방법론 용어를 조회하면 개념팩의 정의와 관련 개념을 확인할 수 있게 한다 | §6-1 서비스 런타임 지식 | P2 |

## 2. 비목표 (Non-goals)

- TMDB 포스터·배경·외부 영화 검색을 제품의 핵심 근거로 삼지 않는다 — PRD v3는 외부 영화 메타데이터 API를 제품 원칙으로 정의하지 않는다.
- 라이브러리 밖의 영화를 AI가 자동 분석한 결과를 검증된 벤치마크로 취급하지 않는다 — 실제 모델 경로는 §4에서 미검증이다.
- 24블록 체계 자체를 학술적으로 검증된 방법론이라고 부르지 않는다 — §3-2에서 24블록 자체는 미검증이다.
- 기준 24편의 인물 보강이나 블록 정의 변경을 임의로 하지 않는다 — §12-5와 §12-6의 검수 대상이다.
- 사용자 프로젝트·계정·서버 저장을 이 기능에서 구현하지 않는다 — 저장 순서는 §6-2의 후속 범위다.

## 3. 화면·컴포넌트

| 화면/컴포넌트 | 파일 | 책임 |
|---|---|---|
| 영화 탐색 홈 | app/page.tsx | 영화 제목 검색, 아이디어 기반 후보 선택, 24편과 76편의 분리된 라이브러리 진입 |
| 영화 상세 | app/movie/[title]/page.tsx | 선택한 영화의 벤치마크 조회와 4막·24블록 결과 표시, /write 변주 진입 |
| 구조 결과 | components/BenchmarkResult.tsx | 영화 메타데이터, 출처 엔진, 구조 검증 상태, 인물과 24블록 표시 |
| 개념 도움말 | components/ConceptHelp.tsx | 용어 버튼을 눌렀을 때 개념 정의·관련 개념·로딩·없음·오류 상태 표시 |
| 정적 도움말 프레젠테이션 | components/HelpPopover.tsx | 전달받은 용어·정의·관련 단계를 팝오버로 표시하며 API를 호출하지 않음 |
| 기준 벤치마크 데이터 | engine/benchmark-library.json, engine/benchmarks.ts | Story 형식의 4막·24블록 참고 데이터 제공 |
| 개념 검색 엔진 | engine/knowledge.ts | 개념 slug·별칭·정의에 대한 정규화 검색과 관련 개념 컨텍스트 구성 |
| 벤치마크 매칭 엔진 | engine/matcher.ts | 아이디어 토큰·키워드와 기준 라이브러리의 휴리스틱 점수 계산 |

**사용자 흐름**: 홈 진입 → 영화 제목 검색 또는 아이디어 입력 → 라이브러리/후보 선택 → 영화 상세에서 24블록 확인 → 필요하면 /write에서 변주 시작

## 4. API 명세

아래는 PRD 의도에 직접 대응하는 개념·벤치마크·아이디어 매칭 계약이다. TMDB 직접 조회와 블록별 제안 API는 PRD 근거가 없어 _unbacked/knowledge.md에 둔다.

### GET|POST /api/concept

| 항목 | 값 |
|---|---|
| 요청 | GET { q: string } 또는 POST { query: string } |
| 응답(성공) | { query: string, concept: { slug: string, definition: string, aliases: string[], related: string[] } } |
| 응답(실패) | 입력 오류 400 { error: string }; 일치 개념 없음 404 { query, concept: null } |
| 모델 사용 | 사용 안 함. 개념팩 정적 조회 |
| 무키 폴백 | 해당 없음 |
| 호출하는 곳 | components/ConceptHelp.tsx:73-77 (POST) |

### GET /api/benchmark

| 항목 | 값 |
|---|---|
| 요청 | 없음 |
| 응답(성공) | { list: Array<{ title?: string, year: string, keyword: string, analyst?: string, origin: "master"|"ai", posterUrl: string|null, backdropUrl: string|null }>, tmdb: boolean } |
| 응답(실패) | 목록 자체의 명시적 실패 응답은 정의되지 않음 |
| 모델 사용 | 목록 자체는 사용 안 함 |
| 무키 폴백 | PRD-backed 지식 조회는 정적 목록으로 유지해야 한다. 포스터 외부 조회 실패의 현재 동작은 _unbacked에 기록 |
| 호출하는 곳 | app/page.tsx:58, app/movie/[title]/page.tsx:27, app/write/page.tsx:72, app/create/page.tsx:57 |

### POST /api/benchmark

| 항목 | 값 |
|---|---|
| 요청 | { title: string, year?: string, genre?: string, info?: string } |
| 응답(성공) | 기준/초안 라이브러리 항목이면 { story: Story, issues: ValidationIssue[], engine: "library"|"ai-library", mode: "benchmark" } |
| 응답(실패) | 본문 오류 400 { error: string }; 라이브러리 밖이고 검증된 분석을 제공할 수 없으면 명시적 미제공 상태 { needsKey: true, engine: "none", mode: "benchmark", available: string[], message: string } |
| 모델 사용 | 기준 라이브러리 조회는 사용 안 함. 키가 있는 미등록 영화의 실제 AI 자동 분석 경로는 PRD 미검증 범위로 _unbacked에 기록 |
| 무키 폴백 | 있음. 알려진 라이브러리 작품은 키 없이 반환하며, 미등록 작품은 검증된 결과 대신 미제공 상태를 반환해야 함 |
| 호출하는 곳 | app/movie/[title]/page.tsx:28-34, app/studio/page.tsx:84-85 |

### POST /api/match

| 항목 | 값 |
|---|---|
| 요청 | { idea: string } |
| 응답(성공) | { matches: Array<{ title: string, year?: string, keyword?: string, logline: string, score: number, matched: string[] }>, method: "heuristic", note: string } |
| 응답(실패) | 아이디어가 비어 있거나 본문이 잘못되면 400 { error: string } |
| 모델 사용 | 사용 안 함. 현재 계약은 휴리스틱 매칭 |
| 무키 폴백 | 있음. 매치 점수가 없으면 대표작 후보를 반환한다. 이는 코드 동작이며 PRD의 대외 AI 성능 근거로 사용하지 않는다 |
| 호출하는 곳 | app/page.tsx:95-98 |

## 5. 데이터 모델

| 타입 | 정의 위치 | 저장 위치 | 비고 |
|---|---|---|---|
| Story | engine/schema.ts:42-63 | engine/benchmark-library.json 및 engine/ai-library/*.json | blocks는 24개, origin은 master 또는 ai로 출처 구분 |
| Character | engine/schema.ts:12-19 | 각 Story.characters | 주인공·적대자·조력자·조연 역할과 요구·결핍·감정선 |
| Block | engine/schema.ts:21-40 | 각 Story.blocks | 1~24 인덱스, 막, 기능, 사건, 전환점·적대자 상승·B스토리 표기 |
| Concept | engine/knowledge.ts:3-10 | knowledge/method/concepts.json 정적 import | slug·정의·별칭·관련 개념 |

**저장 키**: 이 기능의 기준 데이터는 저장 키가 아닌 리포지토리 정적 파일이다. 사용자 작품 저장 키는 이 문서 범위가 아니다.

**마이그레이션**: 기존 Story에 origin이 없으면 기준 라이브러리와 AI 라이브러리를 파일 위치로 판정하지 않고, 검수 절차에서 명시적으로 보강해야 한다. 임의 추정하지 않는다.

## 6. 원칙 준수 (PRD v3 §3)

| 항목 | 이 기능에서의 의미 | 지키는 방법 |
|---|---|---|
| P1 후크는 사람 | 영화 구조는 참고 재료이지 사용자의 후크를 대체하지 않는다 | 영화 결과에서 사용자의 변주를 시작하게 하고, 후크를 자동 생성했다고 말하지 않는다 |
| P2 정직한 표기 | 기준 24편과 AI 분석 초안 76편의 지위를 섞지 않는다 | origin을 출처 계약으로 유지하고, AI 초안에는 “초안”을 명시한다. 실제 화면의 모호한 라벨은 _unbacked에 기록한다 |
| P3 되돌아갈 자유 | 참고 영화를 본 뒤에도 사용자 창작 단계로 돌아갈 수 있어야 한다 | 영화 상세에서 /write 변주 진입을 제공하고, 참고 결과를 사용자 작품으로 오인해 덮어쓰지 않는다 |

가설과의 관계: 아이디어 매칭과 24블록 참고는 H-E/H-F를 검증하는 재료일 뿐, “3안이 최적” 또는 “24블록이 초보자에게 더 낫다”는 결론을 제품 문구로 확정하지 않는다. 검증은 PRD의 해당 가설 검증 조건과 지표를 따른다.

## 7. 검증 기준

| 검증 | 방법 | 통과 조건 |
|---|---|---|
| 데이터 개수 | benchmark-library.json과 engine/ai-library/*.json을 분리 집계 | 기준 24편, AI 분석 초안 76편이며 합산·출처 표기가 일치 |
| 구조 | validateStructure() 결과와 상세 화면 대조 | 24블록, 전환점, 적대자 상승, B스토리, 인물 경고가 결과에 보임 |
| 타입 | npx tsc --noEmit | 에러 0 |
| 빌드 | npx next build | 성공 |
| 실사용 | 오케스트레이터가 브라우저에서 홈 검색·아이디어 매칭·영화 상세를 직접 확인 | 기준/초안 섹션이 구분되고, 외부 이미지가 없어도 구조 결과와 출처 상태가 사라지지 않음 |
