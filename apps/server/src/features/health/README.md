# Health Feature (헬스체크)

`@nestjs/terminus` 기반 헬스체크 엔드포인트입니다. Azure Container Apps의 프로브와 외부 모니터링이 사용합니다.

## 폴더 구조

```
health/
├── health.module.ts
└── controllers/health.controller.ts
```

## API

| 메서드 | 경로      | 설명                      |
| ------ | --------- | ------------------------- |
| GET    | `/health` | 서버 및 DB 연결 상태 확인 |

DB는 `TypeOrmHealthIndicator.pingCheck('database', { timeout: 3000 })`로 검사합니다.

### 응답

```json
{
  "status": "ok",
  "info": { "database": { "status": "up" } },
  "error": {},
  "details": { "database": { "status": "up" } }
}
```

DB 연결이 끊기면 `503`과 함께 `error.database`가 채워집니다.

## 운영 메모

- 인증이 없는 공개 엔드포인트입니다. 내부 상태를 자세히 노출하지 않도록 체크 항목을 무분별하게 늘리지 마세요.
- 컨테이너 readiness/liveness 프로브가 이 경로를 바라본다고 알려져 있으나(문서상), 저장소의 `deploy-server.yml`에는 프로브 설정이 없어 Azure 쪽 설정은 확인하지 못했습니다. 경로를 바꾸기 전에 Azure Container Apps의 프로브 설정을 먼저 보세요.
- DB ping 타임아웃(3초)이 프로브 타임아웃보다 짧아야 의미 있는 실패 신호가 나옵니다.
