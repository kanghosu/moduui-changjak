# knowledge — PRD에 근거가 없는 동작

| # | 코드에 있는 동작 | 위치(파일:줄) | PRD에서 근거를 못 찾은 이유 | 이게 문제인가 |
|---:|---|---|---|---|
| 1 | TMDB API로 영화 자동완성·포스터·백드롭을 검색하고 최대 6건을 반환한다 | app/api/tmdb/route.ts:6-11, engine/tmdb.ts:65-84 | PRD §6-1은 서비스 런타임 영화 지식을 말하지만 TMDB 외부 API, 검색 결과 수, 이미지 URL 계약은 정의하지 않는다 | 의도된 미기재 |
| 2 | TMDB_API_KEY가 없을 때도 하드코딩된 DEFAULT_TMDB_KEY를 사용해 외부 API를 호출한다 | engine/tmdb.ts:61-68 | PRD에 TMDB 키 운영·비밀 관리 정책이 없다. “키가 없다”는 상황의 기대 동작도 정의되지 않았다 | 판단 불가 |
| 3 | TMDB 응답 성공만 파일 캐시하고, 실패하면 빈 결과·색상 이니셜 포스터로 계속 표시한다 | engine/tmdb.ts:40-59,87-104, components/BenchmarkResult.tsx:24-32, app/page.tsx:298-304 | PRD는 사용자 데이터 저장 전략은 규정하지만 포스터 캐시와 외부 API 실패 UX는 규정하지 않는다 | 의도된 미기재 |
| 4 | 키가 있으면 라이브러리 밖의 어떤 영화든 Anthropic으로 24블록 분석하고, 파싱 실패 시 같은 요청을 한 번 재시도한다 | app/api/benchmark/route.ts:146-228 | PRD §4와 §11은 실제 모델 경로가 미검증이고 데모에서 제외한다고 한다. 자동 분석·재시도는 현재 제품 의도로 승인된 요구사항이 아니다 | 의도 이탈 |
| 5 | 벤치마크 목록 응답에 TMDB를 사용했다고 tmdb: true를 고정해서 넣는다 | app/api/benchmark/route.ts:85-108 | PRD에는 이 응답 플래그가 없고, 키·외부 조회 성공 여부를 나타내는 계약도 없다 | 판단 불가 |
| 6 | 24블록을 선택하면 장르 지침·세계 작법 교차표·벤치마크를 섞은 제안 3카드를 반환하고, 키가 있으면 AI 사건 3안을 생성한다 | app/api/suggest/route.ts:24-104, app/studio/page.tsx:88-98 | PRD는 로그라인 3안(H-E 검증 대상)과 24블록을 말하지만, 블록별 제안 카드·장르 지침·Save the Cat 앵커 계약은 정의하지 않는다 | 판단 불가 |
| 7 | 개념 검색은 slug·별칭·본문 포함 여부를 점수화하고, 팝오버를 열 때마다 POST로 조회한다 | engine/knowledge.ts:14-50, app/api/concept/route.ts:5-31, components/ConceptHelp.tsx:68-96 | PRD의 “개념팩” 언급만으로 검색 우선순위·입력 길이·404 형태·지연 조회 UX까지 도출할 수 없다 | 의도된 미기재 |
| 8 | AI 라이브러리의 화면 라벨은 “AI 분석 라이브러리”이고 “AI 분석 초안”이라고는 쓰지 않는다. 다만 기준 24편과는 별도 섹션이며 “거장 확정”으로 직접 표기하지 않는다 | app/page.tsx:253-262, components/BenchmarkResult.tsx:40-42 | PRD §3-1 P2는 AI 분석 초안의 정직한 표기를 요구하지만, 현재 라벨이 검수 완료를 뜻하는지·초안 표기로 충분한지는 명시되지 않는다 | 판단 불가 |
| 9 | 별도 엔진 모듈은 BENCHMARKS와 BENCHMARK_LIST를 “불한당” 1편만 담은 레거시 목록으로 export한다 | engine/benchmarks.ts:9-11,90-94 | PRD §6-1의 서비스 런타임 기준은 24+76편이지만 이 레거시 export가 현재 기능 계약인지 폐기 예정인지 설명하지 않는다 | 판단 불가 |
