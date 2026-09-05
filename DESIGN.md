# 모두의 창작 Design System

## 1. Atmosphere & Identity

모두의 창작은 영화 편집실처럼 집중할 수 있는 어두운 시네마 작업 공간과,
실제 원고를 다듬는 밝은 책상 모드를 함께 제공한다. 시네마 화면의 호박색 포인트가
현재 단계와 사용자의 선택을 알려 주는 단일 인터랙션 신호다.

## 2. Color

| 역할 | 토큰 | Dark | Light | 사용 |
|---|---|---|---|---|
| 배경 | `--c-bg` | `#0F1216` | `#F7F5F0` | 페이지 |
| 표면 | `--c-surface` | `#161A21` | `#FFFFFF` | 카드, 입력 |
| 보조 표면 | `--c-surface2` | `#1C212A` | `#F1EEE6` | 보조 패널 |
| 기본 텍스트 | `--c-text` | `#EDEFF3` | `#1A1D22` | 본문, 제목 |
| 보조 텍스트 | `--c-sub` | `#AAB3C0` | `#474E59` | 설명, 라벨 |
| 약한 텍스트 | `--c-dim` | `#7C8594` | `#767D88` | 메타, 비활성 |
| 경계 | `--c-line` | `#262C36` | `#D8D2C4` | 카드, 입력 경계 |
| 강조 | `--c-amber` | `#F5A524` | `#B04E08` | CTA, 포커스, 선택 |
| 성공 | `--c-ok` | `#4CAF7D` | `#1E7A4F` | 완료 |
| 경고 | `--c-warn` | `#E0A63E` | `#854F0B` | 검증 경고 |
| 오류 | `--c-danger` | `#E2604C` | `#B3362A` | 오류 |

새 컴포넌트는 Tailwind의 `cinema-*` 토큰 또는 `var(--c-*)`를 사용하며 새 색상을
추가하지 않는다. 강조색은 인터랙션에만 사용한다.

## 3. Typography

- 글꼴: `Pretendard Variable`, `Pretendard`, 시스템 sans-serif
- 본문: 15px, line-height 1.65
- 보조 본문: 13.5px, line-height 1.65
- 라벨/메타: 11~12px
- 제목: 18px, 22px, 28px 단계
- 한 화면에서 글꼴 계열은 하나만 사용한다.

## 4. Spacing & Layout

- 기본 단위: 4px
- 주요 간격: 4 / 8 / 12 / 16 / 20 / 24 / 32px
- 본문 최대 폭: Tailwind `max-w-6xl` (1152px)
- 모바일 좌우 여백: 20px
- 주요 브레이크포인트: `md` 768px, `lg` 1024px
- 입력·팝오버의 긴 내용은 폭을 고정하지 않고 한 열로 재배치한다.

## 5. Components

### Card / Input / Action Button

- **Structure**: `card`, `input`, `btn-amber`, `btn-ghost` 클래스
- **Variants**: 시네마 dark, 원고지 light
- **Spacing**: 12~24px 내부 여백
- **States**: default, hover, active, focus, disabled, loading, error
- **Accessibility**: 실제 `button`·`input` 요소, visible focus, 라벨 연결
- **Motion**: 120~180ms의 색상·transform 전환, reduced-motion 존중
- **Layout**: stack / cluster

### ConceptHelp

- **Structure**: 용어 텍스트와 정보 버튼, 인접한 `role="dialog"` 팝오버
- **Variants**: idle, loading, loaded, not-found, error
- **Spacing**: 인라인 용어와 아이콘 사이 4px, 팝오버 내부 12px
- **States**: default, hover, focus, open, loading, error
- **Accessibility**: `aria-label`, `aria-expanded`, Escape 닫기, 키보드 포커스
- **Motion**: open 상태의 opacity/transform만 150ms ease-out
- **Layout**: inline cluster; 팝오버는 trigger를 기준으로 배치

## 6. Motion & Interaction

| 유형 | 시간 | easing | 사용 |
|---|---:|---|---|
| Micro | 120~150ms | ease-out | 버튼·아이콘 상태 |
| Standard | 180~300ms | ease-in-out | 팝오버·패널 |

레이아웃 속성은 애니메이션하지 않는다. `prefers-reduced-motion: reduce`에서는
전환을 끈다. ConceptHelp의 팝오버는 사용자의 클릭과 도움말 상태 변화에만 반응한다.

## 7. Depth & Surface

`mixed` 전략을 사용한다. 어두운 화면은 경계선과 표면 대비로 계층을 만들고,
밝은 원고지 화면의 카드만 기존의 아주 약한 그림자를 사용한다. 새 팝오버는
`card`와 동일한 표면·경계를 사용하며 별도의 그림자를 추가하지 않는다.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA를 목표로 한다.
- 본문 대비 4.5:1 이상, 큰 텍스트 3:1 이상을 유지한다.
- 모든 상호작용 요소는 키보드로 접근 가능하고 포커스가 보여야 한다.
- 한국어 문장이 한 글자만 고립되거나 팝오버 밖으로 잘리지 않도록 긴 텍스트를 자연스럽게 줄바꿈한다.
- 네트워크 오류와 개념 미검색 상태를 사용자에게 설명한다.

### Accepted Debt

| 항목 | 위치 | 이유 | 종료 조건 |
|---|---|---|---|
| Pretendard CDN 로딩 | `app/layout.tsx` | 기존 MVP의 공통 글꼴을 유지 | self-hosted font 도입 시 제거 |

## 9. Marketing Layer

The landing surface uses a separate theater-to-workroom layer. The existing product
`--cin-*` and `--c-*` tokens remain unchanged. Marketing components consume only the
`--mk-*` tokens below.

| Role | Token | Value |
|---|---|---|
| Theater background | `--mk-stage-bg` | `#171717` |
| Theater text / secondary | `--mk-stage-text` / `--mk-stage-sub` | `#EDEFF3` / `#746F67` |
| Theater accent / ink | `--mk-stage-accent` / `--mk-stage-accent-ink` | `#F07A55` / `#171717` |
| Workroom background / card | `--mk-paper-bg` / `--mk-paper-card` | `#F7F4EF` / `#FFFCF8` |
| Workroom line / text / secondary | `--mk-paper-line` / `--mk-paper-text` / `--mk-paper-sub` | `#E5DED4` / `#242321` / `#746F67` |
| Workroom accent / slate / alert | `--mk-paper-accent` / `--mk-paper-slate` / `--mk-paper-alert` | `#F07A55` / `#486A7A` / `#C0392B` |

Marketing typography is Pretendard with `display-1`, `display-2`, `headline`, `lead`,
and `label` scales. `MarketingScrollProvider` owns the landing-only Lenis lifecycle;
`PinSection` owns the sticky parent/child contract, `Timeline24`
owns scroll-filled film cells and callouts, `BlockGrid` owns the real 24-cell HTML grid,
and `WordToCards` owns the word-to-card transition. Every primitive has mobile and
reduced-motion states. Scroll motion uses GPU-friendly opacity/transform/filter only;
`prefers-reduced-motion` renders the final state without pinning.
