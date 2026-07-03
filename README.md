# 모두의 창작 — 작법 엔진 MVP · Claude Code 착수 키트

## 이게 뭔가
'모두의 창작' 작법 엔진을 **Claude Code로 개발**하기 위한 착수 키트입니다.
도메인 레이어(방법론 스킬·온톨로지·24블록 스키마·서브에이전트·빌드 계획)는 채워져 있고,
앱(Next.js)은 Claude Code가 아래 프롬프트로 생성합니다.

> 분업: **도메인 = 이 키트가 제공 / 앱 보일러플레이트 = Claude Code가 생성.**

## 시작 순서
1. 이 폴더를 Claude Code로 엽니다 (`claude` 또는 IDE 확장).
2. Claude Code가 `CLAUDE.md` → `BUILD_PLAN.md`를 먼저 읽게 합니다.
3. **(최우선)** `knowledge/method/24block.md`·`ontology.md`의 `[원본]` 슬롯을
   김태원 「욕망의 레시피」 원본/강의자료로 채웁니다. 엔진 품질이 여기에 달려 있습니다.
4. 아래 **착수 프롬프트**를 순서대로 실행합니다.
5. `.env.local`에 `ANTHROPIC_API_KEY`를 설정합니다 (`.env.local.example` 참고).

## 착수 프롬프트 (Claude Code에 그대로 입력)

**프롬프트 1 — 스키마 확정**
> CLAUDE.md와 BUILD_PLAN.md를 읽어. engine/schema.ts의 타입을 24블록 구조에 맞게 점검·확정하고,
> knowledge/method/24block.md의 구조 앵커(막 경계, 중심 반전점, 적대자 상승 9·14·18, B스토리 8·15·22)를
> 타입과 validateStructure()에 정확히 반영해.

**프롬프트 2 — 앱 스캐폴딩**
> Next.js(App Router, TypeScript, Tailwind)로 app/을 생성해. 화면은 하나:
> 좌측 입력 폼(로그라인·소재·장르·타깃·톤·hookNote), 우측 결과(4막·24블록 타임라인 + 인물/욕망선 카드).
> 엔진은 아직 mock 데이터로 연결해.

**프롬프트 3 — 엔진 연결**
> skills/jakbeop-engine/SKILL.md를 시스템 컨텍스트로 로드하는 API 라우트 /api/generate를 만들어.
> 입력을 받아 Anthropic API(@anthropic-ai/sdk)를 호출하고, 응답을 engine/schema.ts의 Story로
> 검증된 JSON으로 반환해. JSON만 반환하도록 프롬프트를 강제하고, 파싱 실패 시 1회 재시도해.
> UI의 mock을 실제 호출로 교체해.

**프롬프트 4 — 구조 검증기 UI**
> 결과에 validateStructure()를 적용해 error/warn을 화면에 표시하고,
> 위반(반전점 누락, 적대자 상승 9·14·18, B스토리 8·15·22)에 대해 보정 제안 버튼을 붙여.

**프롬프트 5 — 서브에이전트 활용(선택)**
> .claude/agents의 r1-chwijae, r2-structure, r3-character를 워크플로로 엮어
> R1→R2→R3 순으로 호출하고 결과를 병합하는 오케스트레이션을 구성해.

## 다음 단계
`BUILD_PLAN.md`의 Phase 2(현장 검증·피드백 루프), Phase 3(영상화·사업화·거버넌스)로 확장.
