# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.4.2] - 2026-03-29

- 카카오·네이버 OAuth(선택) 및 Google Calendar 연동 플로우(`/settings/connect-google`), 미연동 시 대시보드 진입 제한
- API·JWT 인증을 `user.id` 기준으로 통일; OAuth 리프레시 토큰 AES-256-GCM 저장, `expires_at` 정규화·401 재시도
- 브리핑 NDJSON 스트리밍, Gmail 부분 실패 시 `warnings`·Alert UI, 참석자 처리 개선, 인메모리 레이트 리밋(브리핑·주간 요약)
- 주간 브리핑·LLM 요약 API·UI, `Asia/Seoul` 날짜·주간 타임라인 정합
- `GET /api/health`, GitHub Actions CI, Jest(crypto·rate-limit·korea-time), `npm run typecheck`(`tsconfig.typecheck.json`)
- DB `warnings` 마이그레이션 `scripts/migrate3.js`, 내일 일정 미리보기 hooks 의존성 정리

## [0.4.1] - 2026-03-29

- API 인증을 `user.id` 기준으로 통일 (이메일 없는 소셜 로그인 대응), 참석자 제외는 `email` 옵셔널
- JWT: 카카오/네이버 로그인 시 `userId`를 알 수 없으면 Google 토큰 필드 제거
- 브리핑 NDJSON 스트림: 마지막 청크에 잘리는 한 줄 처리
- 인메모리 레이트 리밋: 브리핑 생성·주간 요약 API (프로덕션 다중 인스턴스 시 Redis 등 권장)
- `GET /api/briefing/today` 날짜를 `Asia/Seoul` 기준 `getSeoulYmd()`로 수정

## [0.4.0] - 2026-03-29

- 카카오·네이버 OAuth 로그인(선택, `KAKAO_*` / `NAVER_*` 설정 시)
- JWT/세션은 **Google 연동 토큰만** API용으로 사용; 카카오·네이버 로그인 시 DB에 연결된 Google `account`에서 로드
- `/settings/connect-google`에서 Google 연결, 미연동 시 대시보드 진입 차단

## [0.3.0] - 2026-03-29

- OAuth refresh 토큰 JWT 저장 시 AES-256-GCM 암호화 (`SECRET_KEY` / `OAUTH_TOKEN_SECRET`)
- `expires_at` 초·밀리초 정규화 및 Google API 401 시 재시도
- 브리핑 NDJSON 스트리밍, Gmail 부분 실패 시 `warnings` 저장·Alert 표시, 참석자 중복 제거·본인 제외
- 설정의 프롬프트 프리셋을 LLM 프롬프트에 반영, 주간 LLM 요약 API·UI (`/api/briefing/week-summary`)
- `GET /api/health`, GitHub Actions CI, `crypto` Jest, DB 마이그레이션 `scripts/migrate3.js` (`warnings` 컬럼)

## [0.2.0] - 2026-03-29

- 주간 API·UI를 `Asia/Seoul` 월~일 기준으로 정리
- `korea-time` Jest 단위 테스트
- Docker (`Dockerfile`, `docker-compose.yml`) 및 Next `standalone` 출력
- README 정리 (Docker, 테스트, 기술 스택 버전)

