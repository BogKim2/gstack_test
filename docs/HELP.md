# Daily Briefing — 프로그램 도움말 (개발자용)

이 문서는 **기능 개요**, **화면(URL)**, **API**, **소스·DB 위치**를 한곳에서 찾기 위한 맵입니다.  
**로그인한 사용자**는 앱에서 **`/help/summary`** 로 검색·메뉴·파일별 라인 수 표를 쓸 수 있습니다.  
설치·실행은 [README.md](../README.md)를 보세요.

---

## 1. 기능 개요

| 영역 | 설명 |
|------|------|
| 로그인 | Google(캘린더·Gmail), 선택적으로 카카오·네이버 (Auth.js v5) |
| Google 연동 | 카카오/네이버로만 로그인한 경우 `/settings/connect-google`에서 Google OAuth 연결 필요 (대시보드 등) |
| 브리핑 | 오늘/내일 일정, 주간 타임라인, LLM 요약(액션 아이템·바쁨 점수 등) |
| 스트리밍 | 브리핑 생성 시 NDJSON 스트림, Gmail 일부 실패 시 `warnings` 저장·UI 표시 |
| LLM | OpenAI 또는 LM Studio(로컬), 설정은 사용자별 DB (`userSettings`) |
| 보안 | OAuth 리프레시 토큰 AES-256-GCM 저장, API는 `user.id` 기준 인증 |
| 운영 | `GET /api/health`, 브리핑·주간 요약 API에 인메모리 레이트 리밋 |

---

## 2. 화면 (App Router)

| URL | 파일 | 역할 |
|-----|------|------|
| `/` | `src/app/page.tsx` | 랜딩 |
| `/auth/signin` | `src/app/auth/signin/page.tsx` | 로그인 |
| `/dashboard` | `src/app/dashboard/page.tsx` | 대시보드·브리핑 카드 등 |
| `/settings` | `src/app/settings/page.tsx` | LLM·프롬프트 등 설정 |
| `/settings/connect-google` | `src/app/settings/connect-google/page.tsx` | Google 계정 연결 |

레이아웃·전역 UI: `src/app/layout.tsx`

---

## 3. HTTP API (`src/app/api/...`)

| 메서드·경로 | 파일 | 설명 |
|-------------|------|------|
| `GET /api/health` | `api/health/route.ts` | 헬스 체크 |
| Auth.js | `api/auth/[...nextauth]/route.ts` | OAuth 콜백·세션 |
| `GET/POST …` (브리핑·설정) | 아래 표 참고 | |

| 경로 | 파일 |
|------|------|
| 브리핑 생성(스트림) | `api/briefing/generate/route.ts` |
| 오늘 | `api/briefing/today/route.ts` |
| 내일 | `api/briefing/tomorrow/route.ts` |
| 주간 일정 | `api/briefing/week/route.ts` |
| 주간 LLM 요약 | `api/briefing/week-summary/route.ts` |
| 사용자 설정 | `api/settings/route.ts` |
| 테스트용 이벤트 생성 | `api/test/create-events/route.ts` (개발·검증용) |

---

## 4. 소스 코드 위치

| 경로 | 내용 |
|------|------|
| `src/components/` | UI 컴포넌트 (`briefing-card`, `week-timeline`, `tomorrow-preview`, `settings-form`, `ui/*` 등) |
| `src/lib/` | 공용 로직: `google-api`, `llm`, `korea-time`, `crypto`, `rate-limit`, `require-auth`, `auth-google-tokens`, `oauth-expiry`, `utils` |
| `src/db/` | Drizzle 스키마·DB 연결 (`schema.ts`, `index.ts`) |
| `src/auth.ts`, `src/auth.config.ts` | Auth.js 설정 |
| `src/middleware.ts` | Next 미들웨어 (현재는 DB 없이 통과) |
| `src/types/next-auth.d.ts` | 세션·JWT 타입 확장 |
| `scripts/migrate3.js` | SQLite `briefing.warnings` 컬럼 마이그레이션 |
| `.github/workflows/ci.yml` | CI: lint, test, build |

---

## 5. 데이터베이스 (SQLite)

스키마 정의: `src/db/schema.ts`

| 테이블 | 용도 |
|--------|------|
| `user`, `account`, `session`, … | Auth.js 표준 |
| `briefing` | 날짜별 브리핑 본문·액션·점수·`warnings` 등 |
| `userSettings` | LLM 제공자, LM Studio URL/모델, 프롬프트 프리셋 |

---

## 6. 환경 변수

목록·예시: [`.env.example`](../.env.example)  
필수: `NEXTAUTH_*`, `GOOGLE_*`, `DATABASE_URL`, `SECRET_KEY` (토큰 암호화) 등.

---

## 7. 이 문서를 유지하는 방법

- **큰 기능 추가·삭제 시** 이 파일의 표·경로를 같이 갱신합니다.
- **사용자용 안내**는 README, **릴리스 이력**은 `CHANGELOG.md`에 두고, 이 파일은 **레포 내비게이션**용으로 쓰면 됩니다.
- 앱 안에 “도움말” 페이지를 넣으려면 `src/app/help/page.tsx`를 만들고 이 파일을 `import`하거나, 빌드 시점에 동일 내용을 복사해 표시할 수 있습니다.
