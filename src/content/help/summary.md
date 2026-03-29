---
title: 전체 요약
order: 0
---

# Daily Briefing — 전체 요약

## 제품 한 줄

Google Calendar·Gmail과 연동한 **AI 일일 브리핑** 앱입니다. OpenAI 또는 LM Studio로 요약·액션 아이템을 생성합니다.

## 주요 기능

| 영역 | 설명 |
|------|------|
| 로그인 | Google, 선택 카카오·네이버 (Auth.js v5) |
| Google 연동 | 카카오/네이버만 쓴 경우 `/settings/connect-google`에서 Calendar API용 Google 연결 |
| 브리핑 | 오늘/내일 일정, 주간 타임라인, LLM 요약·액션·바쁨 점수 |
| 스트리밍 | 브리핑 생성 NDJSON 스트림, Gmail 부분 실패 시 `warnings` |
| LLM | OpenAI 또는 LM Studio, 설정은 DB `userSettings` |
| 보안 | OAuth 리프레시 토큰 AES-256-GCM, API는 `user.id` 기준 |
| 운영 | `GET /api/health`, 브리핑·주간 요약에 인메모리 레이트 리밋 |

## 화면 URL

| URL | 역할 |
|-----|------|
| `/` | 랜딩 |
| `/auth/signin` | 로그인 |
| `/dashboard` | 대시보드 |
| `/settings` | LLM·프롬프트 설정 |
| `/settings/connect-google` | Google 연결 |
| `/help/...` | 이 도움말 |

## HTTP API (요약)

| 경로 | 용도 |
|------|------|
| `GET /api/health` | 헬스 체크 |
| `/api/auth/*` | Auth.js |
| `/api/briefing/generate` | 브리핑 생성(스트림) |
| `/api/briefing/today` | 오늘 |
| `/api/briefing/tomorrow` | 내일 |
| `/api/briefing/week` | 주간 일정 |
| `/api/briefing/week-summary` | 주간 LLM 요약 |
| `/api/settings` | 사용자 설정 |
| `/api/test/create-events` | 테스트 이벤트(개발용) |

## 환경 변수

- 목록·예시: 프로젝트 루트 `.env.example`
- 필수: `NEXTAUTH_*`, `GOOGLE_*`, `DATABASE_URL`, `SECRET_KEY` (토큰 암호화)
- 선택: `KAKAO_*`, `NAVER_*`, `OAUTH_TOKEN_SECRET`, `OPENAI_API_KEY`, LM Studio 관련

## 데이터베이스 (SQLite)

- Auth: `user`, `account`, `session`, …
- 앱: `briefing` (날짜별 요약·`warnings` 등), `userSettings` (LLM)

스키마: `src/db/schema.ts`

## 스크립트·마이그레이션

| 항목 | 설명 |
|------|------|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` / `test` | 검증 |
| `npm run stats:lines` | 파일별 라인 수 표 생성 |
| `node scripts/migrate3.js` | SQLite `warnings` 컬럼 |

## CI

`.github/workflows/ci.yml`: `npm ci` → lint → test → build (환경 변수는 워크플로에 정의)

## 버전

- `VERSION` 파일 및 `package.json`의 `version` 필드

## 코드 규모

- **파일별 전체 라인 표**는 **[파일별 라인 수](/help/lines)** 페이지를 보세요.

## 외부 문서

- 저장소 루트 `README.md`, `CHANGELOG.md`
- 개발자용 개요: `docs/HELP.md`
