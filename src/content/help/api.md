---
title: HTTP API
order: 2
---

# HTTP API

| 경로 | 파일 | 설명 |
|------|------|------|
| `GET /api/health` | `api/health/route.ts` | 헬스 체크 |
| `/api/auth/*` | `api/auth/[...nextauth]/route.ts` | OAuth·세션 |
| 브리핑 생성(스트림) | `api/briefing/generate/route.ts` | NDJSON 스트림 |
| 오늘 | `api/briefing/today/route.ts` | |
| 내일 | `api/briefing/tomorrow/route.ts` | |
| 주간 일정 | `api/briefing/week/route.ts` | |
| 주간 LLM 요약 | `api/briefing/week-summary/route.ts` | |
| 설정 | `api/settings/route.ts` | |
| 테스트 이벤트 | `api/test/create-events/route.ts` | 개발용 |
