# 디자인 결정 기록 (2026-08-24, 강호수 CTO 확정)

근거: docs/design-research.md (레퍼런스 18종) → 부분별 매핑 후 4개 쟁점 결정.

## 확정 사항
| 부분 | 결정 | 참고 레퍼런스 |
|---|---|---|
| **전체 무드** | **B 「편집실의 밤」 시네마 다크 + 앰버 강조 유지** (현 tokens.css/DESIGN.md 그대로). 라이트 모드는 보조(#F7F5F0 책상 모드) | iA Writer 다크, Arc, Save the Cat, Geist |
| 문답 스텝(모드 B) | Typeform식 한 화면 한 질문 + "약 N개 남음" 정직 표시, 질문 ≤10 | Typeform |
| 24블록 타임라인 | Plottr식 가로 타임라인 (가로=진행, 세로=플롯라인/인물선, 줌·필터, 현재 블록 주변만 기본 노출) | Plottr, Miro |
| 재료 보드(모드 A) | P1은 세로 리스트+태그로 단순화, 자유 보드는 P2 | Milanote(P2 예정) |

## 부분별 레퍼런스 매핑 (기본 채택)
- 토큰·컴포넌트 운영: shadcn/Radix + Geist + Toss 문서 방식, 본문 Pretendard
- 입력 화면: iA Writer/Ulysses — 장식 제거, sheet 단위 저장
- 진행 내비게이터: Linear — "확정 산출물 수/남은 빈칸" 표기, 이전 단계 자유 이동
- AI 제안: Sudowrite 반면교사 — 전체 생성 금지, 제안은 옆 카드, 선택 로그
- 설정집: NovelAI Lorebook — 인물/장소 한 장씩 확정·잠금
- 버전·소유감: Notion 블록·버전 복원 + Scrivener 스냅샷("다른 방향 초안")
- 커뮤니티·거래(P2~P3): 네이버웹툰 MY + Tapas Ink — 편집 화면에 잠금 금지
