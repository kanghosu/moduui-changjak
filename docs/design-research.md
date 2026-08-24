# 모두의 창작 「모두의 영화」 디자인 리서치

작성일: 2026-08-24
범위: P1 소유감 창작 코어 — 장면 우선/문답 우선, 우측 진행 내비게이터, 긴 글 입력, 24블록 타임라인, 이후 스토리툰·커뮤니티·거래 확장

## 읽는 법과 조사 방법

공식 제품 페이지·도움말을 먼저 방문하고, 사용성의 장단점은 독립 리뷰·사용자 피드백을 보조 근거로 삼았다. 제품이 현재 강조하는 기능은 “잘하나”, 사용자가 겪을 수 있는 복잡성·한계는 “못하나/주의”로 분리했다. 우리 제품에 적용하는 문장은 리서치 사실이 아니라 디자인 제안이며, 외부 근거가 부족한 해석은 **추정**으로 표시했다.

스크린샷은 별도 수집하지 않았다. 아래 URL에서 기능 설명과 화면 묘사를 직접 확인할 수 있다.

## 1. 제품별 카드

### 카드 1 — Sudowrite

- **무엇을 잘하나:** Story Engine을 Canvas 옆 사이드바에 배치해 아이디어에서 장편으로 올라가는 별도 작업면을 제공한다. Canvas는 인덱스 카드처럼 개요를 시각적으로 보고 문서·Story Bible로 되돌릴 수 있다. 장면 단위의 확장·대안 제시는 “막힌 순간 바로 다음 행동”을 만든다.
- **무엇을 못하나/주의:** 공식 메시지 자체가 “AI writing partner”와 빠른 장편 완성을 전면에 둔다. 독립 리뷰와 사용자 피드백에서는 긴 원고의 캐릭터 일관성, 크레딧 소비, AI 문체가 드러나는 문제가 반복된다. 즉, 잘 쓰는 보조자이지만 사용자가 선택·수정한 흔적을 보존하는 편집 모델은 별도 설계가 필요하다.
- **우리 P1에 훔쳐올 패턴:** ① 생성 버튼을 전체 원고 생성이 아니라 “다음 선택지 3개/한 문단 확장”으로 제한 ② AI 제안은 원문을 덮지 않고 카드로 옆에 쌓기 ③ 생성 결과마다 “내가 고른 이유/수정한 부분”을 남기는 선택 로그 제공.
- **출처:** [Sudowrite Story Engine](https://feedback.sudowrite.com/changelog/introducing-story-engine), [Sudowrite Canvas 문서](https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/canvas/pQGLNzeYo1kLhGo14rdBy6), [독립 리뷰](https://kindlepreneur.com/sudowrite-review/), [장문 사용 리뷰](https://ucstrategies.com/news/sudowrite-review-i-tested-the-22-month-ai-against-chatgpt-across-70000-words/)

### 카드 2 — NovelAI

- **무엇을 잘하나:** Lorebook이 캐릭터·장소·물건·세력 같은 세계관 정보를 항목화하고, 본문에 특정 키가 나타날 때만 문맥에 주입한다. 항목을 켜고 끄거나 숨기고, 생성 기록을 확인할 수 있어 세계관을 사용자가 직접 관리한다.
- **무엇을 못하나/주의:** Lorebook은 강력하지만 사용자가 키·활성화 창·문맥을 직접 튜닝해야 한다. 사용자 리뷰에서는 긴 원고에서 설정을 잊거나 반복하는 문제가 보고된다. **추정:** 초보 창작자에게는 “내가 세계관을 만든다”보다 “AI 설정을 관리한다”는 부담이 먼저 느껴질 수 있다.
- **우리 P1에 훔쳐올 패턴:** ① 설정집을 자동 생성하지 말고 캐릭터/장소/규칙을 한 장씩 확정 ② 확정된 설정은 단계별 결과에 표시하되 잠금·해제 가능하게 ③ AI가 사용한 근거를 “이번 제안에 반영된 내 메모”로 노출.
- **출처:** [NovelAI Lorebook 문서](https://docs.novelai.net/en/text/lorebook/), [NovelAI Text Adventure 문서](https://docs.novelai.net/en/text/textadventure/), [사용자 리뷰](https://www.reddit.com/r/NovelAi/comments/ow7iez/my_experience_with_novelai/), [2026 리뷰](https://shakespeareai.net/blog/novelai-review-2026)

### 카드 3 — Plottr

- **무엇을 잘하나:** Timeline을 중심으로 챕터·씬·플롯라인을 드래그 앤 드롭하고, 씬 카드에 POV·목표·갈등·캐릭터·장소·태그를 연결한다. 줌 아웃·필터·색상으로 전체 구조와 개별 디테일을 오갈 수 있으며, 템플릿과 Story Bible을 함께 둔다.
- **무엇을 못하나/주의:** 계획·분류·태깅의 선택지가 많아 빈 보드에서 처음 시작하는 사용자에게는 “무엇부터 채울지”가 남는다. 리뷰에서도 Timeline/Outline을 자유롭게 설정하는 것이 장점인 동시에 구조를 직접 정해야 하는 부담으로 읽힌다.
- **우리 P1에 훔쳐올 패턴:** ① 24블록을 처음부터 모두 노출하지 않고 “현재 확보된 장면 → 연결 후보 → 빈 인과” 순으로 점진 공개 ② 카드에 상태·POV·욕망·갈등을 작은 칩으로 표시 ③ 색상은 장식이 아니라 플롯라인/확정도/사용자 선택 상태에만 사용.
- **출처:** [Plottr Features](https://plottr.com/features/), [Plottr Timeline 도움말](https://docs.plottr.com/article/58-timeline-starter-templates), [Plottr 2.0 소개](https://plottr.com/introducing-plottr-2/), [Reedsy 리뷰](https://reedsy.com/blog/guide/book-writing-software/plottr-review/)

### 카드 4 — Campfire Writing

- **무엇을 잘하나:** 인물·문화·백과사전·아이템·장소·지도·원고·타임라인을 모듈로 나누고, Timeline의 이벤트 카드 안에 메모를 중첩한다. 브라우저·데스크톱·모바일에서 같은 프로젝트에 접근하는 스토리 바이블형 작업에 강하다.
- **무엇을 못하나/주의:** 모듈이 풍부해 단순한 이야기의 첫 진입에는 과하다. 독립 리뷰와 사용자 피드백에서는 패널이 크고 화면이 압도적으로 느껴지거나, 장별 원고를 한 문서로 조망하는 흐름이 불편하다는 의견이 확인된다.
- **우리 P1에 훔쳐올 패턴:** ① 모듈을 기능 메뉴가 아니라 단계별 “이번에 필요한 자료”로 제한 ② 사이드 패널은 접고, 현재 입력과 참고 자료의 비율을 사용자가 조절 ③ 이벤트 카드에 메모를 넣되 최종 산출물에 포함될지 명시.
- **출처:** [Campfire 앱/플랫폼](https://campfirewriting.com/apps), [Campfire 스토리 플래너](https://campfirewriting.com/story-planner), [Reedsy 리뷰](https://reedsy.com/blog/guide/book-writing-software/campfire-write-review/), [사용자 UI 피드백](https://www.reddit.com/r/CampfireTechnology/comments/1chwg4j/ui_issues/)

### 카드 5 — Milanote

- **무엇을 잘하나:** “생각은 선형적이지 않다”는 전제로 텍스트·이미지·영상·마인드맵을 한 보드에 섞고, 웹 클리퍼가 원본 링크까지 저장한다. 스토리 구조를 인덱스 카드처럼 조망하고 드래그해 재배치한다.
- **무엇을 못하나/주의:** 자유 캔버스는 탐색에는 좋지만, 어느 순간 무엇을 확정해야 하는지 자동으로 알려주지 않는다. **추정:** 모두의 영화의 질문 상한 10개와 24블록 완주 목표에는 캔버스 전체를 주 작업면으로 삼기보다, 장면 수집·리서치 보조면으로 쓰는 편이 적합하다.
- **우리 P1에 훔쳐올 패턴:** ① 장면 우선 모드에서 “재료 보드”를 제공 ② 이미지·링크·짧은 메모를 한 카드로 묶고 출처 보존 ③ 보드에서 확정한 카드만 단계 산출물로 승격.
- **출처:** [Milanote Writing Software](https://milanote.com/product/writing-software)

### 카드 6 — iA Writer와 Ulysses

- **무엇을 잘하나:** iA Writer는 기능을 덜어낸 편집면, Markdown, Focus Mode로 문장 작성 중 시선을 한 곳에 둔다. Ulysses는 작은 sheet 단위로 원고를 나누면서도 단일 라이브러리에서 전체 작업을 관리하고, sheet/group/project 단위 목표와 진행 이력을 제공한다.
- **무엇을 못하나/주의:** 집중 편집기는 구조화·브레인스토밍을 별도 도구로 밀어낸다. Ulysses도 장문 자료·시놉시스·씬을 관리할 수 있지만, 복잡한 협업 변경 추적이나 시각적 스토리 보드는 주력이 아니다. **추정:** 우리 제품이 이들의 미니멀리즘만 가져오면 학습 단계의 안내가 사라질 수 있다.
- **우리 P1에 훔쳐올 패턴:** ① 긴 글 입력 화면에서는 좌우 장식을 줄이고 현재 문장/질문을 중심에 배치 ② 입력을 sheet처럼 작게 저장해 단계별 소유감을 만들기 ③ 글자 수 대신 “이번 단계에서 확보한 재료”와 다음 목표를 함께 표시.
- **출처:** [iA Writer](https://ia.net/writer/), [iA Focus Mode](https://ia.net/writer/support/editor/focus-mode), [Ulysses](https://www.ulysses.app/), [Ulysses Goals](https://help.ulysses.app/the-dashboard/goals), [Ulysses 사용 리뷰](https://www.techradar.com/computing/ios/ulysses-review)

### 카드 7 — Scrivener

- **무엇을 잘하나:** 한 프로젝트 파일 안에서 Binder·Corkboard/Index Cards·Outliner·Inspector를 오가고, 장면을 재배열하면서 초고와 구조를 함께 관리한다. 스냅샷은 큰 수정 전 상태를 복사해 되돌릴 수 있게 한다.
- **무엇을 못하나/주의:** 기능과 화면 모드가 많아 초보자가 “어떤 화면이 지금 필요한가”를 판단해야 한다. 사용자 커뮤니티에서도 기능이 직관적이지 않고 옵션이 많다는 지적이 반복된다.
- **우리 P1에 훔쳐올 패턴:** ① “작성/구조/검토”를 명시적 화면 모드로 단순화 ② 장면 카드와 본문을 같은 데이터로 연결 ③ 확정·보류·실험 버전을 별도 스냅샷으로 보존해 다시 쓰는 두려움 제거.
- **출처:** [Scrivener Features](https://scrivenerprogram.com/features), [Scrivener Manual](https://www.literatureandlatte.com/docs/Scrivener_Manual-Win.pdf), [사용자 평가](https://www.reddit.com/r/scrivener/comments/ia9wqk/scrivener_101_a_practical_guide/)

### 카드 8 — 스토리헬퍼

- **무엇을 잘하나:** 공개 자료 기준으로 1,300여 편 영화·애니메이션 분석, 205개 모티프와 대규모 DB를 바탕으로 아이디에이션·트리트먼트·파이널 스크립트 단계를 제공했다. 클래식/랜덤/조합/프리 모드로 질문형 매칭과 자유 입력을 함께 시도한 점은 선구적이다.
- **무엇을 못하나/주의:** 현재 서비스의 실제 화면·운영 상태는 이번 조사에서 안정적으로 확인하지 못했다. 공개 연구는 29개 질문, 영화 매칭, 유사도·분석 템플릿을 설명한다. **추정:** 질문 수와 기존 모티프 선택 중심 구조가 사용자의 자유 발화를 늦추고, 답변 피로·“내 이야기가 아니라 DB 조합”이라는 인상을 만들었을 가능성이 있다. 이는 PRD의 회의 기록과도 일치하지만, 이 리서치만으로 인과를 확정할 수는 없다.
- **우리 P1에 훔쳐올 패턴:** ① 질문은 최대 10개로 하드 리밋하고 이미 말한 내용을 다시 묻지 않기 ② 자유 발화 후 부족한 항목만 질문 ③ 영화 매칭은 정답·복제 모델이 아니라 선택 가능한 참고 카드로 제공.
- **출처:** [IT조선 사용법 기사](https://it.chosun.com/news/articleView.html?idxno=2013071885044), [스토리헬퍼 연구](https://123dok.co/document/y6eong7n-study-ending-movie-viewpoint-problem-storytelling-focusing-storyhelper.html), [KISS 논문 페이지](https://kiss.kstudy.com/DetailOa/Ar?key=53824686), [KOCCA 소개 자료](https://www.kocca.kr/knowledge/publication/createcontents/__icsFiles/afieldfile/2013/10/11/OBxkVdDtGGia.pdf)

### 카드 9 — Typeform

- **무엇을 잘하나:** 한 화면에 한 질문을 보여주고, 응답에 따라 branching으로 다른 경로를 만든다. 진행률, 예상 소요 시간, 결과(outcome), 답변 재활용을 통해 설문을 대화처럼 보이게 한다.
- **무엇을 못하나/주의:** 선형 폼의 진행률은 branching 경로에 따라 예상과 다르게 보일 수 있다. 질문이 많으면 한 화면씩 넘기는 리듬 자체가 피로해질 수 있고, 입력자의 자유 발화보다 폼 설계자의 분기 구조가 앞설 위험이 있다.
- **우리 P1에 훔쳐올 패턴:** ① 질문 하나+짧은 예시+현재 단계만 보여주기 ② “대략 3분/남은 질문 4개”를 실제 분기 경로에 맞게 계산 ③ 답변에 따라 다음 질문을 줄이고, 뒤로 가도 앞선 답변을 잃지 않기.
- **출처:** [Typeform 첫 폼 만들기](https://help.typeform.com/hc/en-us/articles/360053660271-My-first-form), [Progress bar 도움말](https://help.typeform.com/hc/en-us/articles/360051557892-Activate-the-Progress-bar), [독립 비교/리뷰](https://www.techradar.com/best/best-online-form-builder)

### 카드 10 — Linear

- **무엇을 잘하나:** 프로젝트·마일스톤·이슈를 한 구조로 묶고, 진행률·현재 포커스·필터를 사이드 패널과 타임라인에 압축한다. 커맨드 메뉴와 키보드 단축키가 어디서든 탐색·생성·이동을 가능하게 하고, 드래그로 순서를 바꿔도 같은 모델을 유지한다.
- **무엇을 못하나/주의:** 키보드 중심 효율은 반복 사용자를 빠르게 하지만 첫 방문자에게는 숨겨진 기능이 된다. **추정:** 영화 창작 초보자에게 단축키를 먼저 가르치면 창작보다 도구 학습이 앞설 수 있다.
- **우리 P1에 훔쳐올 패턴:** ① 우측 내비게이터에 현재 단계·완료·잠금·다음 행동을 동시에 표시 ② 모든 단계 이동을 커맨드 팔레트에서 검색 가능하게 ③ 진행률은 단순 퍼센트가 아니라 “확정된 산출물 수/남은 핵심 빈칸”으로 설명.
- **출처:** [Linear Project Milestones](https://linear.app/docs/project-milestones), [Linear Project Overview](https://linear.app/docs/project-overview), [Linear Search](https://linear.app/docs/search), [Linear 온보딩 UX 사례 연구](https://www.shaheermalik.com/blog/linear-onboarding-ux-design-case-study)

### 카드 11 — Notion

- **무엇을 잘하나:** 텍스트·이미지·표·하위 페이지를 모두 block으로 보고, 페이지를 사용자가 원하는 순서와 조합으로 쌓는다. 블록 핸들·복제·이동·버전 히스토리로 콘텐츠의 위치와 과거 상태를 사용자가 직접 통제한다.
- **무엇을 못하나/주의:** 무엇이든 만들 수 있는 빈 페이지는 초보자에게 시작점이 없다. 블록 자유도가 높을수록 정보 구조와 시각적 위계가 사용자에게 넘어가며, **추정:** 창작 플로우의 “다음에 무엇을 해야 하나”를 대신 안내하지 못한다.
- **우리 P1에 훔쳐올 패턴:** ① 사용자가 쓴 장면·선택·AI 제안을 각각 편집 가능한 블록으로 저장 ② 블록 핸들처럼 “이 문장을 장면 카드로 승격/뒤로 이동” 제공 ③ 자동 저장·버전 복원·부분 복사를 기본값으로 두어 소유권을 가시화.
- **출처:** [Notion Block 개념](https://www.notion.com/help/what-is-a-block), [Notion 콘텐츠 복원/버전 히스토리](https://www.notion.com/en-gb/help/duplicate-delete-and-restore-content)

### 카드 12 — Arc와 Figma

- **무엇을 잘하나:** Arc는 Space마다 색·아이콘·고정 탭·폴더를 분리하고, 커맨드 바에서 Space 전환·새 자료 생성·이름 변경을 수행한다. Easel은 웹에서 찾은 조각을 링크와 함께 캔버스에 모아 개인·협업 보드로 만든다. Figma는 템플릿·Community·UI kit로 첫 화면에서 빈 캔버스를 줄이고, 온보딩 플로우에도 Skip을 둔다.
- **무엇을 못하나/주의:** Arc의 Space/Easel은 개념이 강력하지만 기능 이름을 모르면 발견성이 낮고, Easel 편집은 플랫폼 제약이 있다. Figma의 템플릿 선택지가 많아도 사용자가 자기 목적에 맞는 파일을 고르는 일이 남는다.
- **우리 P1에 훔쳐올 패턴:** ① 프로젝트마다 색·아이콘·짧은 제목을 사용자가 정해 “내 작업실”로 만들기 ② 보드/단계/결과를 커맨드 검색으로 빠르게 이동 ③ 온보딩에서 건너뛰기와 나중에 보기 허용, 대신 첫 입력은 즉시 시작.
- **출처:** [Arc Spaces](https://resources.arc.net/hc/en-us/articles/19228064149143-Spaces-Distinct-Browsing-Areas), [Arc Command Bar](https://start.arc.net/command-bar-actions), [Arc Easels](https://start.arc.net/paint-the-internet), [Figma Templates](https://www.figma.com/templates/), [Figma 온보딩 플로우](https://help.figma.com/hc/en-us/articles/18888057155991-Create-an-onboarding-flow-with-advanced-prototyping)

### 카드 13 — Save the Cat! Story Suite

- **무엇을 잘하나:** 15-Beat Story Map, Digital Story Board, 캐릭터·관계·감정 추적, Scene Card Editor, Version Snapshots를 한 작업공간에 묶는다. 초보자용 프롬프트와 구조를 제공하면서도 장면 카드를 재배열하고 PDF/Word로 내보낼 수 있다.
- **무엇을 못하나/주의:** 15비트 구조를 전면에 두면 사용자가 자신의 소재를 구조에 맞추는 방향으로 사고할 수 있다. **추정:** 모두의 영화는 24블록 용어를 최종 단계까지 숨기기로 했으므로, Save the Cat의 명시적 비트 노출은 참고하되 초기 UX에는 그대로 복사하지 않는 것이 맞다.
- **우리 P1에 훔쳐올 패턴:** ① 최종 단계에서만 구조 이름을 공개하고 앞 단계는 자연어 질문으로 진행 ② 구조 카드와 감정/캐릭터 추적을 함께 연결 ③ Version Snapshot을 “다른 방향으로 시험한 초안”으로 명명해 실험을 장려.
- **출처:** [Save the Cat! Story Suite](https://savethecat.com/save-the-cat-story-structure-software-suite), [Beat Mapper](https://savethecat.com/beat-mapper), [스토리보드/소프트웨어 소개](https://savethecat.com/news/its-here-save-the-cat-story-structure-software-30-on-sale-today)

### 카드 14 — Miro와 FigJam

- **무엇을 잘하나:** Miro Timeline은 카드·스티키를 드래그해 시간축으로 시각화하고 그룹을 숨기거나 재정렬한다. 복사한 타임라인을 원본과 동기화하거나 템플릿으로 분리할 수 있다. FigJam은 타임라인 템플릿, 스티키, 투표, 협업 커서를 제공해 함께 아이디어를 펼치기 쉽다.
- **무엇을 못하나/주의:** 무한 보드는 풍부하지만, 구조화되지 않은 정보가 쌓이면 정리 비용이 생긴다. 공유 보드에서 모든 사용자가 동시에 편집할 때 변경의 책임자·확정 상태가 흐려질 수 있다.
- **우리 P1에 훔쳐올 패턴:** ① 장면 카드를 먼저 자유롭게 모으고 “확정 배치”할 때만 24블록 축에 놓기 ② 타임라인에는 그룹·필터·줌을 두되 현재 블록과 주변 2~3개만 기본 노출 ③ 카드 복제는 원본과 연결된 파생안으로 표시.
- **출처:** [Miro Timeline 도움말](https://help.miro.com/hc/en-us/articles/20185235301650-Timeline), [Miro Sticky Notes](https://help.miro.com/hc/en-us/articles/360017572054-Sticky-notes), [FigJam Timeline Template](https://www.figma.com/templates/timeline-template/), [FigJam 협업](https://www.figma.com/figjam/team-collaboration/)

### 카드 15 — 네이버웹툰

- **무엇을 잘하나:** 작품·회차 열람을 중심으로 관심작, 최근 본 작품, 새 회차 알림, 소장 회차, 댓글·답글, 공유 현황을 MY에 모은다. 쿠키/무료대여권/광고보고무료 같은 진입 장치를 열람 흐름 안에 배치한다.
- **무엇을 못하나/주의:** 무료·미리보기·소장·댓글·공유가 동시에 존재하면 독자가 “읽기”와 “구매/보관”의 차이를 학습해야 한다. P3 커뮤니티를 곧바로 복제하면 창작 도구의 집중 흐름을 흐릴 수 있다.
- **우리 P1에 훔쳐올 패턴:** ① 완료작·최근 작업·다음 할 일을 개인 라이브러리로 묶기 ② 결과물 공유는 P1에서 선택적 링크로만 열고, 거래 UI는 P3로 분리 ③ 작품/회차처럼 프로젝트/버전/완성본의 단위를 명확히 구분.
- **출처:** [네이버웹툰 MY 메뉴 기능](https://help.naver.com/service/5635/contents/7929?lang=ko&osType=MOBILE), [WEBTOON 앱의 무료/Coins 안내](https://webtoon.zendesk.com/hc/en-us/articles/360051602511-Is-the-WEBTOON-app-free)

### 카드 16 — 카카오페이지와 Tapas

- **무엇을 잘하나:** 카카오페이지는 오리지널 웹툰·웹소설을 작품 홈에서 탐색하고, “기다리면 무료”로 본 시점 이후 무료 이용권이 충전되게 한다. Tapas는 회차 잠금에 Ink를 사용하고, 독자가 Ink로 창작자를 직접 지원할 수 있다. 두 서비스 모두 무료 회차→연속 열람→유료/후원으로 이어지는 거래 단위를 명확히 한다.
- **무엇을 못하나/주의:** 무료·기다림·선구매·후원 통화가 많아질수록 가격/대기 상태의 인지 비용이 커진다. Tapas의 앱 리뷰에서는 Wait Until Free와 Ink 보상 구조에 대한 불만도 확인된다.
- **우리 P1에 훔쳐올 패턴:** ① P2 스토리툰은 “무료 공개 → 다음 장면 미리보기 → 거래”의 단위를 회차/장면 단위로 설계 ② 잠금은 편집 중인 창작 화면에 섞지 않고 완성·공개 화면에서만 ③ 창작자 후원과 독자 구매를 다른 CTA로 분리.
- **출처:** [카카오페이지 공식 서비스 소개](https://www.kakaocorp.com/page/service/service/kakaopage), [Tapas Home](https://tapas.io/index.htm), [Tapas Ink](https://help.tapas.io/hc/en-us/articles/115005798107-What-is-Ink-How-do-I-get-some), [Tapas Support Program](https://help.tapas.io/hc/en-us/articles/4408643923995-Support-Program), [Tapas 앱 리뷰](https://apps.apple.com/us/app/tapas-comics-and-novels/id578836126)

### 카드 17 — shadcn/ui, Radix, Vercel Geist

- **무엇을 잘하나:** Radix는 접근성·키보드 동작을 담당하는 비스타일 primitives, shadcn/ui는 소스 코드를 프로젝트로 가져와 직접 소유하는 컴포넌트 모음, Geist는 색상 스케일과 타이포 스케일을 일관된 토큰으로 제공한다. Next.js+Tailwind 스택에서 빠르게 시작하면서도 제품 고유의 표면을 만들기 좋은 조합이다.
- **무엇을 못하나/주의:** primitives와 토큰은 제품의 정보 구조·콘텐츠 톤을 결정해주지 않는다. shadcn을 그대로 사용하면 많은 제품이 비슷한 카드·버튼·다크 테마로 보일 수 있고, Geist의 영문 중심 느낌은 한글 장문 편집에서 별도 보정이 필요하다.
- **우리 P1에 훔쳐올 패턴:** ① Radix로 Dialog/Popover/Tooltip/Accordion의 접근성 기반을 확보 ② shadcn의 “코드 소유” 원칙을 창작 데이터에도 적용해 내보내기·버전 복원을 기본 제공 ③ Geist처럼 색상·타입·상태를 토큰화하되, 한글 본문은 Pretendard 계열로 별도 검증.
- **출처:** [shadcn/ui Components](https://ui.shadcn.com/docs/components), [Radix Introduction](https://www.radix-ui.com/primitives/docs/overview/introduction), [Geist Typography](https://vercel.com/geist/typography), [Geist Colors](https://vercel.com/geist/colors)

### 카드 18 — Toss Design System과 Pretendard

- **무엇을 잘하나:** Toss는 큰 구조→상위 옵션→세부 요소→상태 변화 순으로 컴포넌트 가이드를 작성한다. Pretendard는 Inter·본고딕·M PLUS 1p를 바탕으로 한글과 라틴 혼용 가독성을 보정한 무료 오픈 폰트다.
- **무엇을 못하나/주의:** Toss의 운영 규모·조직 프로세스를 그대로 복사할 수는 없다. Pretendard가 중립적이고 읽기 좋은 만큼, 제품의 창작 무드를 폰트 하나로 만들 수는 없다.
- **우리 P1에 훔쳐올 패턴:** ① 컴포넌트 문서를 사용 상태·실패 상태·다크 모드까지 포함해 작성 ② 본문은 Pretendard, 영문 숫자도 같은 계열로 먼저 통일 ③ 무드는 컬러·아이콘·카드 질감에서 만들고 긴 글은 중립성을 유지.
- **출처:** [Toss 디자인 시스템 가이드](https://toss.tech/article/toss-design-system-guide), [Toss 디자인 시스템 운영](https://toss.tech/article/toss-design-system), [Pretendard 공식 저장소](https://github.com/orioncactus/pretendard)

## 2. 패턴 종합

### 2.1 단계형 진행 UI — “진행률”보다 “내가 만든 것”을 보여준다

가장 좋은 조합은 Typeform의 한 질문 리듬, Linear의 상시 내비게이터·검색, Save the Cat의 구조 지도, Notion의 복원성이다.

- **우측 진행 내비게이터:** 전체 6단계만 항상 보여준다. 각 단계는 `상태 아이콘 + 사용자 산출물 이름 + 다음 행동`으로 구성한다. 예: `1. 재료 모으기 / 장면 3개 저장됨`, `2. 방향 고르기 / 로그라인 3안 중 1안 선택`.
- **현재 단계:** 강조색은 현재 한 곳에만 쓴다. 이전 단계는 자유롭게 클릭해 수정하고, 이후 단계는 잠금 대신 “아직 비어 있음” 상태로 보여준다.
- **질문 카운트:** `질문 4/10`을 고정값으로 표시하지 말고, 분기 후 남은 예상 질문 수를 표시한다. 추정값이면 `약 3개 남음`처럼 정직하게 쓴다.
- **완료 단위:** “단계 완료” 버튼보다, 로그라인 선택·캐릭터 확정·장면 배치 같은 사용자 행동이 완료 상태를 만든다.
- **빠른 이동:** 데스크톱에서는 `⌘/Ctrl+K` 커맨드 팔레트와 `←/→` 이전/다음 이동을 제공하되, 초보자에게 단축키 학습을 요구하지 않는다.
- **이탈 방지:** 나가기·새로고침 전 자동 저장 상태와 마지막 저장 시각을 표시한다. “다음에 이어쓰기”가 제품의 기본 종료 경로다.

권장 P1 단계: `재료 모으기 → 부족한 것 묻기 → 방향 선택 → 인물/장르 심화 → 장면 배치 → 24블록 검토`.

### 2.2 긴 글 입력의 타이포·여백 규범

iA Writer와 Ulysses에서 공통으로 읽히는 원칙은 **편집 중인 문장이 주인공**이어야 한다는 것이다. 웹 표준에 하나의 정답이 있는 것은 아니므로 아래 값은 제안 초안이다.

- 본문 폭: 데스크톱 680~760px, 장면 카드 메모 560~680px. 한 줄이 지나치게 길어지지 않게 한다.
- 본문 크기/행간: 한글 본문 17~19px, line-height 1.75~1.9. 입력창 placeholder는 본문보다 낮은 대비로 두되, 실제 입력과 구분한다.
- 제목 체계: 화면 제목 28~32px/1.25, 단계 제목 22~24px/1.35, 카드 제목 16~18px/1.45. 한글에서 굵기보다 줄 간격과 문장 길이를 먼저 조절한다.
- 여백: 입력 시작 전 48~64px, 문단 사이 20~28px, 질문과 답변 영역 사이 24~32px. 긴 입력 중 우측 진행 내비게이터는 폭 224~280px로 고정한다.
- 집중 모드: 타임라인·자료 패널을 접어 편집 폭을 넓힌다. 기능을 없애기보다 한 번의 토글로 숨긴다.
- 입력 손맛: 커서가 보이는 상태에서 자동 생성이 화면을 밀어내지 않도록, AI 제안은 원문 아래 인라인 카드 또는 우측 제안 큐에 넣는다.

### 2.3 “내 것” 느낌을 만드는 마이크로인터랙션

소유감은 큰 애니메이션보다, 사용자의 작은 결정을 잃지 않는 피드백에서 생긴다.

- **버전 히스토리:** `내 초안`, `AI 제안`, `내가 고친 버전`, `분기 실험안`을 구분한다. 자동 저장은 조용히, 주요 선택은 “방금 선택을 저장했어요”로 알려준다.
- **손맛:** 장면 카드를 드래그하면 놓일 위치에 삽입선과 “앞뒤 인과 확인” 힌트를 보여준다. 놓은 뒤 카드가 튀지 않고 살짝 정착한다.
- **선택 흔적:** 로그라인 3안에서 선택한 안은 `내 선택` 배지를 갖고, 버린 안도 삭제하지 않고 접힌 대안으로 보존한다.
- **AI 거리 조절:** `제안 보기 → 일부 가져오기 → 내 문장으로 다듬기` 3단계로 제공한다. “전체 적용”은 기본 CTA가 아니다.
- **저장 언어:** “생성 완료”보다 “내 장면 저장”, “내 선택 반영”, “이 버전으로 이어쓰기”를 사용한다.
- **복구:** 되돌리기/다시 적용, 스냅샷 이름 변경, 특정 카드만 이전 버전에서 복사하기를 지원한다.

### 2.4 타임라인 시각화 패턴

Plottr·Save the Cat·Miro/FigJam에서 유효한 패턴은 카드-축-필터의 결합이다.

- 24블록 전체는 최종 단계에서만 공개한다. 이전에는 `앞/중간/뒤`, `전환`, `결정`, `결과` 같은 자연어 구간으로 숨긴다.
- 카드에는 제목 1줄, 장면 요약 2줄, 상태 1개, 연결 인물 1~2명만 기본 표시한다. 상세는 펼침 패널로 보낸다.
- 가로축은 이야기 진행, 세로축은 플롯라인/인물선으로 둔다. 모바일에서는 세로 스택으로 변환하고 현재 카드 주변만 유지한다.
- 색은 4개 이하를 기본으로 한다: 메인 플롯, 서브 플롯, 사용자 메모, AI 제안. 색만으로 상태를 전달하지 않고 텍스트/아이콘을 병기한다.
- `줌 아웃`은 전체 구조를 보고, `필터`는 특정 인물·감정·확정 상태를 보는 기능으로 분리한다.
- 빈칸을 실패처럼 붉게 표시하지 않는다. `아직 선택하지 않음`, `앞 장면이 필요함`처럼 다음 행동을 설명한다.

### 2.5 다크/라이트 전략

- **라이트 기본:** 초보 창작자의 첫 진입, 긴 글 입력, 공유·내보내기 화면은 라이트가 안전하다. 종이·노트의 은유를 사용하더라도 순백 배경 대신 따뜻한 회백을 사용한다.
- **다크 선택:** 밤 작업·타임라인 집중·스토리툰 미리보기에서는 다크를 제공한다. 검정(#000)과 순백(#fff)의 강한 대비를 피하고, 본문은 약간 낮은 밝기로 둔다.
- **컴포넌트 기준:** 색상 토큰을 `background / surface / elevated / text / muted / accent / danger`로 분리한다. 다크 모드에서 그림자를 그대로 뒤집지 말고 테두리·명도 차이를 사용한다.
- **상태 보존:** 모드 전환으로 입력 내용·스크롤·현재 단계가 바뀌지 않아야 한다. 사용자의 모드 선택은 프로젝트 단위로 기억한다.
- **무드 분리:** 라이트/다크를 서로 다른 브랜드로 만들지 않는다. 같은 액센트 색과 동일한 단계 의미를 유지한다.

## 3. 우리 디자인 시스템 제안 초안

### 3.1 무드 방향 3가지

| 방향 | 형용사 | 참고 제품 | 적용 시 인상 |
|---|---|---|---|
| **A. 따뜻한 작업실** | 따뜻한, 종이 같은, 차분한, 손으로 만든, 격려하는, 친밀한 | Milanote, Notion, Ulysses, Toss | 초보자가 오래 머물며 쓰기 좋다. P1 기본 방향으로 가장 안전하다. |
| **B. 편집실의 밤** | 영화적인, 집중된, 깊은, 대비감 있는, 장면 중심의, 몰입적인 | iA Writer 다크, Arc Spaces, Save the Cat Story Suite, Geist 다크 | 장면·타임라인과 스토리툰 미리보기에 강하다. 단 초보자에게 무거워질 수 있다. |
| **C. 조용한 스튜디오** | 정제된, 정확한, 공백 많은, 현대적인, 신뢰감 있는, 확장 가능한 | Linear, Figma, Radix/shadcn, Vercel Geist | 글로벌·커뮤니티 확장에 유리하다. 창작의 손맛은 카드 질감과 마이크로인터랙션으로 보완해야 한다. |

권장 순서: **A를 라이트 기본으로 채택하고 B의 다크 타임라인/스토리툰 무드를 보조 테마로 실험**한다. C의 토큰·컴포넌트 운영 방식을 기술 기반으로 가져온다.

### 3.2 컬러 팔레트 후보

#### 후보 A — 따뜻한 작업실(권장)

| 역할 | 라이트 | 다크 |
|---|---:|---:|
| Canvas | `#F7F4EF` | `#171717` |
| Surface | `#FFFCF8` | `#22211F` |
| Elevated | `#FFFFFF` | `#2C2A27` |
| Text | `#242321` | `#F4F0EA` |
| Muted text | `#746F67` | `#A8A198` |
| Accent / 선택 | `#C65A3A` | `#F07A55` |
| Secondary / 장면 | `#486A7A` | `#8AB4C7` |
| Success / 확정 | `#4F765E` | `#8BC19B` |
| Border | `#E5DED4` | `#3C3935` |

#### 후보 B — 편집실의 밤

| 역할 | 라이트 | 다크 |
|---|---:|---:|
| Canvas | `#F2F3F5` | `#111318` |
| Surface | `#FFFFFF` | `#1A1D24` |
| Text | `#1E222B` | `#F2F4F8` |
| Muted text | `#6D7480` | `#9AA3B1` |
| Accent / 선택 | `#8B6CF6` | `#A98CFF` |
| Secondary / 장면 | `#D27A47` | `#F2A06B` |
| Success / 확정 | `#4D9B7C` | `#71C29F` |
| Border | `#DEE2E8` | `#303642` |

#### 후보 C — 조용한 스튜디오

| 역할 | 라이트 | 다크 |
|---|---:|---:|
| Canvas | `#FAFAFA` | `#0A0A0A` |
| Surface | `#FFFFFF` | `#171717` |
| Text | `#171717` | `#F5F5F5` |
| Muted text | `#737373` | `#A3A3A3` |
| Accent / 선택 | `#2563EB` | `#60A5FA` |
| Secondary / 장면 | `#0F766E` | `#2DD4BF` |
| Success / 확정 | `#15803D` | `#4ADE80` |
| Border | `#E5E5E5` | `#2E2E2E` |

색상 값은 제품 제안이며 접근성 대비 검증 전의 초안이다. 본문·보조 본문·비활성·포커스·에러 상태를 실제 컴포넌트로 조합해 WCAG 대비를 확인해야 한다.

### 3.3 한글+영문 타이포 스택

1차 권장:

```css
font-family: Pretendard, Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

- 본문/입력/내비게이터: `Pretendard` 400/500/600
- 화면 제목·작품명: `Pretendard` 600/700
- 숫자·단축키·블록 번호: `Pretendard` 또는 `Geist Mono` 500
- 긴 본문을 문학적으로 읽는 최종 미리보기: `Pretendard`를 기본으로 두고, **추후** 무료 명조 계열(예: Noto Serif KR)을 선택 옵션으로 실험한다. 강제 명조는 P1 입력 피로를 늘릴 수 있으므로 추정이다.
- 웹폰트 로딩은 400/500/600/700만 우선하고, 폰트 로딩 전에도 줄바꿈이 크게 변하지 않도록 `font-display: swap`과 fallback 폭을 테스트한다.

### 3.4 spacing/radius 스케일

| 토큰 | 값 | 용도 |
|---|---:|---|
| `space-1` | 4px | 아이콘-텍스트, 칩 내부 |
| `space-2` | 8px | 컴포넌트 내부 최소 간격 |
| `space-3` | 12px | 입력 라벨·보조문 |
| `space-4` | 16px | 기본 카드 패딩, 행 간격 |
| `space-5` | 20px | 문단 간격 |
| `space-6` | 24px | 그룹 간격, 질문-답변 |
| `space-8` | 32px | 섹션 내부 |
| `space-10` | 40px | 단계 전환 |
| `space-12` | 48px | 큰 화면 시작 여백 |
| `space-16` | 64px | 히어로/집중 편집 상단 |

권장 radius: `sm 6px`(입력/칩), `md 10px`(버튼/카드), `lg 16px`(패널/모달), `xl 24px`(작품 선택/스토리툰 프리뷰), `full 999px`(배지/토글). 카드마다 radius를 다르게 주기보다 계층별로 고정한다.

### 3.5 P1 화면 우선 컴포넌트 12개

1. **ProjectShell** — 좌측 작업 브랜드/프로젝트, 중앙 작업면, 우측 진행 내비게이터의 3열 골격
2. **ProgressNavigator** — 단계 상태·산출물·다음 행동·자유 뒤로 이동
3. **ModePicker** — 장면 우선/문답 우선 선택 카드와 짧은 예시
4. **SceneComposer** — 텍스트/음성 입력, 임시 저장, 장면 태그
5. **QuestionStep** — 한 질문·예시·답변·예상 남은 질문 수
6. **AnswerChip/ChoiceCard** — 로그라인 3안, 후보 블록, 벤치마크 선택
7. **SuggestionQueue** — AI 제안, 근거, 부분 적용, 버리기, 다시 쓰기
8. **DraftBlock** — 사용자 문장·AI 보조·확정 상태가 보이는 편집 블록
9. **VersionPopover** — 자동 저장, 스냅샷, 이전 버전 비교/부분 복사
10. **StoryTimeline** — 24블록/자연어 구간, 줌·필터·드래그 배치
11. **SceneCard** — 장면 요약·인물·욕망·갈등·확정도·연결선
12. **HelpPopover** — “플롯이 뭐예요?” 같은 개념 도움말과 출처/관련 단계 링크

P1에서는 Modal·Toast·Tooltip·Tabs 같은 기초 primitives를 Radix/shadcn 기반으로 보조 사용하되, 위 12개가 제품의 고유 컴포넌트다. 우선순위는 `진행/입력/선택/버전`을 먼저 고정하고, 타임라인은 입력 모델이 안정된 뒤 연결한다.

## 결론 — P1에 적용할 한 문장

**Typeform처럼 한 번에 한 가지를 묻고, Linear처럼 내가 어디에 있는지 항상 보여주며, Notion/Scrivener처럼 내가 쓴 조각을 잃지 않고, Plottr/Save the Cat처럼 마지막에 구조를 조망한다.** AI의 역할은 완성문을 대신 쓰는 것이 아니라 사용자가 고르고 고친 흔적을 다음 단계의 재료로 정리하는 것이다.
