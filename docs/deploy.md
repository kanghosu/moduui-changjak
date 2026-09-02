# 배포 전 비용 보호 체크리스트

- `ANTHROPIC_API_KEY`를 서버 환경변수로만 등록한다.
- 필요하면 `ANTHROPIC_MODEL`과 `ANTHROPIC_MODEL_LIGHT`를 설정한다. 모델 하향 여부는 [`docs/model-policy.md`](./model-policy.md)의 품질·비용 기준으로 판단한다.
- `GUARD_RPM`(기본 6), `GUARD_DAILY`(기본 300), `GUARD_MAX_INPUT`(기본 4000)을 확인한다. `GUARD_DISABLED=1`은 로컬 개발에서만 사용한다.
- `KV_REST_API_URL`과 `KV_REST_API_TOKEN`을 함께 등록한다.

**KV 없이 배포하면 레이트리밋이 완전하지 않다.** 인메모리 카운터는 서버리스 인스턴스마다 따로 유지되는 best-effort라 인스턴스 간 요청 수를 공유하지 않는다.

사고가 나면 `GUARD_DAILY=0`으로 설정해 실제 AI 모델을 호출하는 라우트를 즉시 잠글 수 있다. 배포 환경변수 반영 뒤 새 요청부터 적용된다.
