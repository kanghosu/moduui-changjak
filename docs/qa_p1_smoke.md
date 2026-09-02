# P1 스모크 QA

실행일: 2026-08-24

## 전제

- `npm run start -- -p 3105`로 최신 production build를 기동했다.
- `ANTHROPIC_API_KEY`를 설정하지 않은 상태에서 휴리스틱 경로를 확인했다.
- Windows PowerShell에서 UTF-8 JSON을 curl stdin으로 전달했다.

## F1 도움말 API

명령:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$payload = '{"query":"결핍"}'
$payload | curl.exe -sS -i "http://localhost:3105/api/concept" -H "Content-Type: application/json" --data-binary "@-"
```

결과:

```text
HTTP/1.1 200 OK
query: 결핍
concept.slug: 결핍(缺乏, Lack)
concept.related: 욕구(NEED), 요구(DEMAND·WANT), 욕망(DESIRE), ...
```

## 장면 역산 API

명령:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$payload = '{"sceneText":"주인공은 오랫동안 숨겨 온 배신의 진실을 알게 되고, 믿었던 동료와 대치한다."}'
$payload | curl.exe -sS -i "http://localhost:3105/api/scene-blocks" -H "Content-Type: application/json" --data-binary "@-"
```

결과:

```text
HTTP/1.1 200 OK
engine: heuristic
mode: scene-reverse
candidates: 10, 13, 8, 14 (4개)
benchmarks: 매트릭스(1999), 조커(2019) (2편)
```

각 후보에는 블록 기능과 선택 이유가 포함되며, 각 벤치마크에는 유사 단서와 매칭 블록이 포함된다.

## 빌드·브라우저 확인

- `cmd /c npm run build`: 통과. 최신 실행 결과에서 TypeScript 검사, 15개 정적 페이지 생성, `/api/concept`, `/api/scene-blocks` 라우트 생성 확인.
- `/write`의 `결핍` 도움말: 375px, 768px, 1280px에서 정의 로드 및 팝오버 표시 확인.
- 최신 빌드 브라우저 측정: 세 뷰포트 모두 `horizontalOverflow: false`, `dialogWithinViewport: true`.
- Escape로 팝오버를 닫은 뒤 dialog 개수 `0` 확인.
- 최신 빌드 콘솔 error/warning `[]` 확인.

## 지식팩 검증

- 발췌본 개념 수: 276개(core 67 + standard 209)
- 각 항목 키: `slug`, `definition`, `aliases`, `related`만 존재
- 원본 registry의 `sources`/출처 슬라이드·쪽 번호는 발췌하지 않음
