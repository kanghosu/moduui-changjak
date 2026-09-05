# 모두의 창작 디자인 시스템

P1의 기본 표면은 디자인 리서치 §3의 후보 A **따뜻한 작업실**이다. 종이처럼 따뜻한 라이트 캔버스에서 사용자가 오래 쓰고, 후보 B **편집실의 밤**은 타임라인·프리뷰의 집중용 보조 테마로 사용한다. 진행 상태는 퍼센트보다 사용자가 만든 산출물과 다음 행동으로 설명한다.

## 1. 토큰

### 색상

| 역할 | CSS 변수 | 라이트 기본 | 다크 보조 | 용도 |
|---|---|---|---|---|
| Canvas | `--canvas` | `#F7F4EF` | `#171717` | 페이지 작업면 |
| Surface | `--surface` | `#FFFCF8` | `#22211F` | 카드, 입력 |
| Elevated | `--elevated` | `#FFFFFF` | `#2C2A27` | 팝오버, 선택된 표면 |
| Text | `--text` | `#242321` | `#F4F0EA` | 본문, 제목 |
| Muted | `--muted` | `#746F67` | `#A8A198` | 설명, 메타, 보조 라벨 |
| Accent | `--accent` | `#B54E32` | `#F07A55` | 현재 단계, 주요 행동 |
| Secondary | `--secondary` | `#486A7A` | `#8AB4C7` | 장면, AI 제안 구분 |
| Success | `--success` | `#4F765E` | `#8BC19B` | 확정, 저장 완료 |
| Danger | `--danger` | `#B3362A` | `#F08A7C` | 오류, 입력 안내 |
| Border | `--border` | `#E5DED4` | `#3C3935` | 경계, 구분 |

Tailwind에서는 `bg-canvas`, `bg-surface`, `bg-elevated`, `text-text`, `text-muted`, `bg-accent`, `text-secondary`, `text-success`, `text-danger`, `border-border`처럼 사용한다. 투명도가 필요할 때도 `bg-accent/10`처럼 같은 토큰의 alpha만 사용한다.

### 대비 조정 내역

- 후보 A 라이트 Accent 원안 `#C65A3A`는 `#FFFCF8` 위 본문 크기 대비가 **4.17:1**로 AA 4.5:1에 미달했다. 명도만 한 단계 낮춘 `#B54E32`로 조정했으며 대비는 **5.01:1**이다.
- 후보 A의 `Muted #746F67`는 `#FFFCF8` 위 **4.87:1**, `Secondary #486A7A`는 **5.67:1**, `Success #4F765E`는 **5.03:1**로 유지했다.
- 후보 A 표에 Danger 역할이 없어 기존 시스템의 오류색 `#B3362A`를 의미 토큰으로 보완했다. 라이트 Surface 위 **5.90:1**이며, 다크 보조 테마는 `#F08A7C`로 두어 `#171717` 위 **7.37:1**을 확보했다.
- 다크 후보 A 원안의 Accent `#F07A55`, Muted `#A8A198`, Secondary `#8AB4C7`, Success `#8BC19B`는 `#171717` 위 각각 **6.51:1, 7.01:1, 8.05:1, 8.71:1**로 조정하지 않았다.
- 대비 계산은 WCAG 2 AA 일반 본문 기준 4.5:1을 사용했다. 경계색은 텍스트로 사용하지 않고 구조 구분에만 쓴다.

### 타이포그래피

`styles/tokens.css`에 jsdelivr CDN의 Pretendard 400/500/600/700을 `font-display: swap`으로 선언한다.

```css
font-family: Pretendard, Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

| 토큰 | 값 | 사용 |
|---|---:|---|
| `--font-size-h1` | 28px / 1.25 | 화면 제목 |
| `--font-size-h2` | 22px / 1.35 | 섹션 제목 |
| `--font-size-h3` | 18px / 1.35 | 카드 제목 |
| `--font-size-body` | 15px / 1.65 | 본문, 입력 |
| `--font-size-body-sm` | 13.5px / 1.65 | 설명, 내비게이터 |
| `--font-size-label` | 12px / 1.4 | 메타, 상태 |

### 간격과 radius

모든 간격은 4px 기본 단위에서 파생한다. Tailwind에서는 `ds-` 접두사 매핑을 사용한다.

| 토큰 | 값 | 대표 사용 |
|---|---:|---|
| `--space-1` ~ `--space-6` | 4 / 8 / 12 / 16 / 20 / 24px | 인라인·컴포넌트 내부 |
| `--space-8` | 32px | 그룹 간격 |
| `--space-10` | 40px | 단계 전환 |
| `--space-12` | 48px | 주요 구획 |
| `--space-16` | 64px | 집중 편집 시작 여백 |
| `--radius-sm` | 6px | 입력, 칩 |
| `--radius-md` | 10px | 버튼, 카드 |
| `--radius-lg` | 16px | 패널, 진행 내비게이터 |
| `--radius-xl` | 24px | 큰 프리뷰 |
| `--radius-full` | 999px | 배지, 테마 토글 |

## 2. 사용 규칙

1. 한 화면의 의미 있는 색은 Canvas/Surface 계열을 제외하고 4개 이하로 유지한다.
2. Accent는 현재 단계 또는 현재 행동 한 곳에만 쓴다. 장식용 그라디언트와 무작위 강조색은 금지한다.
3. 빈칸은 실패색으로 표시하지 않는다. `아직 비어 있음`, `앞 장면이 필요함`, `아직 선택하지 않음`처럼 상태와 다음 행동을 함께 쓴다.
4. AI 제안은 사용자 문장을 덮지 않는다. `제안 보기 → 일부 가져오기 → 내 문장으로 다듬기` 순서를 지키고, 전체 적용을 기본 CTA로 두지 않는다.
5. 이전 단계는 다시 클릭해 수정할 수 있게 하고, 이후 단계는 잠그지 않고 `아직 비어 있음`으로 보여준다.
6. 상태를 색만으로 전달하지 않는다. 텍스트와 `aria-current`, `aria-pressed`, `aria-invalid`를 함께 사용한다.
7. 모든 상호작용 요소는 키보드 포커스가 보이며, reduced-motion 환경에서는 비필수 전환을 끈다.
8. 라이트는 기본 작업면, 다크는 타임라인·프리뷰 집중 모드다. 모드 전환 시 단계나 입력 내용을 바꾸지 않는다.

## 3. 컴포넌트 API 요약

### 기초 컴포넌트 `components/ui/`

| 컴포넌트 | 주요 props | 상태/규칙 |
|---|---|---|
| `Button` | `variant: primary \| ghost \| quiet`, `loading`, 표준 button props | primary/ghost/quiet, disabled, loading, focus |
| `Card` | `tone: surface \| elevated \| interactive` | 표면 계층을 위한 border/radius, interactive hover |
| `Chip` | `variant: default \| accent \| secondary \| success \| danger` | 상태를 짧은 텍스트로 병기 |
| `Input` | `label`, `hint`, `error`, 표준 input props | default, focus, disabled, error |
| `Textarea` | `label`, `hint`, `error`, 표준 textarea props | 긴 글 입력, resize, disabled, error |
| `Popover` | `trigger`, `children`, `open`, `onOpenChange`, `align` | Escape/바깥 클릭 닫기, dialog semantics |

`Popover`는 Radix API를 도입할 수 있도록 `trigger/children/open/onOpenChange` 계약을 유지한 프레젠테이션 wrapper다. 현재 작업 환경에서 `@radix-ui/react-popover` 설치 권한이 거부되어 native DOM fallback으로 동작한다. 의존성 설치 권한이 확보되면 내부 구현만 Radix primitive로 교체한다.

### P1 고유 컴포넌트 `components/`

| 컴포넌트 | 주요 props | 책임 |
|---|---|---|
| `ProgressNavigator` | `steps`, `onStepChange` | 단계 상태, 산출물명, 다음 행동, 이전 이동, 이후 `아직 비어 있음` |
| `ModePicker` | `value`, `onChange` | 장면 우선/문답 우선 선택 카드 |
| `ChoiceCard` | `options`, `selectedId`, `onSelect` | 로그라인 선택, `내 선택` 배지, 버린 안 접힘 보존 |
| `DraftBlock` | `userText`, `suggestionText`, `onPartialImport` | 사용자 문장/AI 제안 분리, 일부 가져오기 자리 |
| `HelpPopover` | `term`, `definition`, `relatedStep` | 용어와 정의만 받는 프레젠테이션 컴포넌트. API 호출 없음 |

## 4. 프리뷰 상태 목록

`/design`에서 라이트/다크 토글, 전체 색상 스와치, 6단계 타이포, Button 3 variants와 disabled/loading, Chip 상태, Input/Textarea default/error/disabled, Popover, 두 입력 모드, 로그라인 선택과 보관된 안, DraftBlock, ProgressNavigator, 마이크로카피 규범을 확인할 수 있다.

검수 시 375px에서 한 열로 재배치하고, 768px·1280px에서 카드와 진행 내비게이터의 관계가 유지되는지 확인한다.

---

## 5. 상호작용 패턴 (2026-09-01 신설 — 경쟁 리버스 엔지니어링 기반)

근거: `../../docs/research-v3/F_SaveTheCat_FinalDraft.md`(STC·Final Draft 역공학) ·
`D_UX벤치마킹.md` §5 · `E_페인포인트.md` §2(학술 원칙). 토큰(§1)은 바꾸지 않는다 — 여기는 **움직임의 규칙**이다.

### 5-1. 원칙 — 왜 이렇게 움직이나

| 원칙 | 내용 | 근거 |
|---|---|---|
| **답하면 변한다** | 모든 입력은 300ms 안에 눈에 보이는 작품 상태 변화로 돌아온다. 뱃지·점수·스트릭은 쓰지 않는다 | E: 게이미피케이션 요소 조합이 자동으로 효과를 더하지 않음. 작품 상태가 보상이다 |
| **진행은 작품 단위** | "질문 3/10"이 아니라 "핵심 갈등 확정 · 결말 미정" | E: Jeong 2025 — 진행 피드백이 자기효능감을 높임 |
| **연출은 진행을 막지 않는다** | 전환 애니메이션 ≤300ms, non-blocking, `prefers-reduced-motion` 존중. Enter 진행은 항상 즉시 | 사용자 결정 "흐름을 빠르게" |
| **비파괴** | 사용자가 만든 것은 삭제 대신 "보류"로. 재생성은 이전 것을 보존한다 | STC Litter Box(복구 가능 보관함) · 우리 P3 원칙 · G12 로그라인 히스토리와 일관 |
| **완료를 선언한다** | 단계·전체 완료 시 명시적 완료 화면과 다음 행동 2개 | E: 완료 신호 부재는 자기효능감 손해 |
| **탈출구는 품질이다** | 내보내기(JSON+Markdown, 장래 FDX 실험)는 기능이 아니라 신뢰 장치 | F §4.4-5 · 경쟁 10개 전부 제공 |

### 5-2. 구조 보드의 의미 색 (semantic tags)

STC 소프트웨어의 색상 카드 보드에서 이식하되, 4막 배경색과 **별개의 의미 태그 층**으로 쓴다.
기존 검증 토큰만 재사용한다(새 색 도입 금지 — 대비 재검증 비용 방지).

| 의미 태그 | 대상 블록 | 토큰 | 필터 |
|---|---|---|---|
| 전환점 | 7 · 13 · 19 | `--accent` | "전환점만 보기" |
| 적대자 상승 | 9 · 14 · 18 | `--danger` (테두리/칩만, 배경 금지) | "적대자만 보기" |
| B스토리 | 8 · 15 · 22 | `--secondary` | "B스토리만 보기" |
| 상실·보상 | 18 · 22 | `--success` (22) / `--danger` (18) | — |

> 우리 24블록이 STC 15비트보다 강한 지점이 바로 이 축들이다(F §4.1 매핑표):
> 적대자 3단 상승(9→14→18)과 B스토리 3체크포인트(8→15→22)는 STC에 없는 검증 구조다.
> **색은 이 우위를 시각화하는 수단이다.**

### 5-3. 계획 레인 ↔ 실제 사건 연결 (FD Outline Editor 이식)

Final Draft 13의 Outline Editor 패턴: 상단 구조 레인과 하단 실제 내용이 같은 항목을 가리킨다.
- 우리 적용: `StoryTimeline`(24칸 레인) 선택 ↔ 작업실 블록 편집이 **같은 블록을 하이라이트**
- 블록 13·18·19(핵심 앵커)는 비어 있으면 레인에서 경고 표시
- 구현 상태: 선택 연동은 있음. 양방향 하이라이트·앵커 경고는 P1 백로그

### 5-4. 적용 현황표

| 패턴 | 상태 |
|---|---|
| 답변 즉시 프로필 카드 갱신 (`LiveProfileCard`) | ✅ 구현 (Wave 7) |
| 작품 단위 진행 표시 | ✅ 구현 (Wave 7) |
| 질문별 "이 답으로 만들어지는 것" | ✅ 구현 (Wave 7) |
| 단계 전환 연출 ≤240ms·reduce-motion | ✅ 구현 (Wave 7) |
| 완료 화면 + 행동 2개 | ✅ 구현 (Wave 7) |
| AI 추측 / 사용자 확정 구분 표기 | ✅ 구현 (Wave 7, P1 원칙) |
| 로그라인 재생성 시 이전 3세트 보존 | ✅ 구현 (Wave 2) |
| 의미 색 태그 + 필터 (5-2) | ⏳ P1 백로그 |
| 레인↔사건 양방향 연결 + 앵커 경고 (5-3) | ⏳ P1 백로그 |
| 블록 "보류함" (Litter Box식 비파괴 보관) | ⏳ P2 백로그 |
| setup/payoff 양방향 연결 + 미회수 경고 | ⏳ P2 백로그 (F §4.2-4) |
| FDX + JSON sidecar 내보내기 | ⏳ 실험 (F §4.3 조건부 판정 준수 — "FDX 초안(실험)" 표기) |

## 6. 비주얼 생성용 프롬프트 (클로드 디자인 도구용)

사용자가 화면 시안을 AI로 뽑을 때 붙여넣는 기준 프롬프트. 토큰·패턴과 어긋난 시안이 나오지 않게 한다.

```
한국어 창작 지원 웹앱 「모두의 창작」의 화면을 디자인해줘.

무드: "따뜻한 작업실" — 종이 질감의 라이트 캔버스(#F7F4EF), 카드 표면(#FFFCF8),
테라코타 액센트(#B54E32), 청회색 보조(#486A7A). 시네마 다크(#171717)는 타임라인 집중 모드에만.
타이포: Pretendard. 제목 굵게, 본문 400. 한국어 최적화.

레이아웃 원칙:
- 한 화면 한 질문 (Typeform식). 질문 위에 "이 답으로 만들어지는 것 · ___" 한 줄.
- 오른쪽(또는 하단)에 항상 살아있는 "창작 프로필 카드": 반영된 것 / AI가 추측한 값(구분 표기) / 아직 빈 것.
- 진행 표시는 퍼센트·개수 금지. "핵심 갈등 확정 · 결말 미정"처럼 작품 단위.
- 타임라인은 Plottr식 24칸 가로 눈금 등폭. 전환점(7·13·19)은 액센트색,
  적대자 상승(9·14·18)은 위험색 테두리, B스토리(8·15·22)는 보조색 칩.
- 완료 화면: "이야기 지도가 완성됐어요" + [작업실에서 이어가기] [내보내기] 두 버튼.

금지: 뱃지·점수·스트릭·레벨 등 게임 장식. 이모지 남발. 흰 배경의 차가운 SaaS 느낌.
느낌: 도구가 아니라 작업실. 사용자가 쓴 문장이 화면의 주인공.
```

> 시안이 나오면 §1 토큰·§5 패턴과 대조해 어긋난 것(새 색, 퍼센트 진행바, 게임 장식)을 걷어낸다.

## 7. 마케팅 층

랜딩은 제품 작업실의 `--cin-*`·`--c-*` 토큰과 분리된 마케팅 표면이다. 제품 토큰은
수정하지 않으며, 아래 `--mk-*` 토큰만 `/`, `/ko`, `/zh` 랜딩에서 사용한다.

### 7-1. 팔레트

| 표면 | 토큰 | 값 | 용도 |
|---|---|---|---|
| 극장 | `--mk-stage-bg` | `#171717` | hero·problem·turn·try 배경 |
| 극장 | `--mk-stage-text` | `#EDEFF3` | 제목·본문 |
| 극장 | `--mk-stage-sub` | `#746F67` | 보조 설명 |
| 극장 | `--mk-stage-accent` | `#F07A55` | CTA·전환점·커서 |
| 극장 | `--mk-stage-accent-ink` | `#171717` | 테라코타 버튼 글자 |
| 극장 | `--mk-stage-glow` | `rgba(240,122,85,.18)` | 하단 라디얼 글로우 |
| 작업실 | `--mk-paper-bg` | `#F7F4EF` | structure·library·done 배경 |
| 작업실 | `--mk-paper-card` | `#FFFCF8` | 카드·필름 스트립 |
| 작업실 | `--mk-paper-line` | `#E5DED4` | 카드·눈금 경계 |
| 작업실 | `--mk-paper-text` | `#242321` | 제목·본문 |
| 작업실 | `--mk-paper-sub` | `#746F67` | 보조 설명 |
| 작업실 | `--mk-paper-accent` | `#F07A55` | 전환점·밑줄 |
| 작업실 | `--mk-paper-slate` | `#486A7A` | B스토리 칩 |
| 작업실 | `--mk-paper-alert` | `#C0392B` | 적대자 상승 테두리 |

### 7-2. 디스플레이 타이포그래피

Pretendard를 유지한다. `display-1`은 96px/1.05/700/-0.02em(모바일 40px/1.1),
`display-2`는 72px/1.08/700(모바일 36px/1.1), `headline`은 44px/1.15/600
(모바일 32px/1.2), `lead`는 20px/1.5/400(모바일 17px/1.55), `label`은
14px/1.4/600/+0.2em(모바일 12px)이다. 제목의 의도된 2줄은 사전의 `\n`을 `<br>`로
렌더하고, 본문은 의미 단위가 고립되지 않도록 자연스럽게 줄바꿈한다.

### 7-3. 모션·반응형 규칙

| 토큰 | 값 | 용도 |
|---|---|---|
| `--mo-micro` | `120ms` | 버튼·토글 |
| `--mo-reveal` | `480ms cubic-bezier(.2,.8,.2,1)` | 섹션 진입 |
| `--mo-stagger` | `120ms` | 카드·단어 순차 지연 |

`PinSection`은 부모의 `data-pin-vh` 높이(100/150/200/250vh)와 자식의
`position: sticky; top: 0`으로 구성한다. Motion의 진행값은
`useScroll({ target, offset: ["start start", "end end"] })`에서 가져오며, 색상·transform·
opacity만 스크롤과 연결한다. 640px 이하 또는 `prefers-reduced-motion: reduce`에서는
부모 높이와 sticky를 해제하고 `data-pin="false"`, 진행값 1, 정적 최종 상태를 쓴다.

### 7-4. 섹션 리듬과 마케팅 전용 컴포넌트

콘텐츠 최대 폭은 1120px, 좌우 여백은 5vw, 섹션 간 여백은 0으로 둔다. 극장→작업실
전환은 `turn-cards.webp`와 작업실 오버레이를 섹션 3 안에서 한 번 사용하고, 섹션
6→7은 하드컷한다. 재사용 primitive는 `MarketingScrollProvider`, `PinSection`, `Reveal`, `ProductFrame`,
`Timeline24`, `BlockGrid`, `WordToCards`, `MarketingFooter`이며 각각 기본·모바일·
reduced-motion 상태를 제공한다. 기존 `WaitlistForm`과 평범한 `<a>` 기반 `LangSwitcher`는
재사용하되, 폼의 fetch 계약과 언어 전환 방식은 바꾸지 않는다.

### 7-5. 마케팅 접근성·정직성

모든 CTA는 실제 링크 또는 버튼이고 포커스 링을 유지한다. 의미 있는 이미지는
`next/image`로 크기와 alt를 지정하며, 분위기 이미지는 빈 alt를 사용한다. 핀과
스크롤 연동은 정보의 순서를 바꾸지 않고, reduced-motion에서는 24칸 전체·카드 최종
상태를 바로 보여준다. 라이브러리 편수, 수상·뱃지·과장 표현, API 키 없는 결과의
AI 표기는 사용하지 않는다.
