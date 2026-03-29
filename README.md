# Daily Briefing App

AI-powered daily calendar briefing with privacy-first design.

## Features

- Google Calendar and Gmail for briefings (OAuth refresh tokens encrypted at rest)
- Optional Kakao and Naver sign-in. Calendar API access requires **Google linked** in-app at `/settings/connect-google` (dashboard is blocked until Google is connected when that flow applies)
- AI action items (max 3 per day), delta briefing, weekly timeline, and LLM week summary using `Asia/Seoul` week boundaries
- NDJSON streaming for briefing generation; in-memory rate limits on briefing and week-summary routes (use Redis etc. in multi-instance production)
- `GET /api/health` for load balancers and uptime checks
- Self-hostable with Docker
- LLM choice: OpenAI or LM Studio (local)

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials (`NEXTAUTH_SECRET`, `GOOGLE_*`, `DATABASE_URL`, `SECRET_KEY` for token encryption; optional `KAKAO_*` / `NAVER_*`)
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`
7. If you sign in with Kakao or Naver first, open **Settings** and use **Connect Google** so Calendar-backed features work

## LM Studio Setup (Optional)

If you want to use local LLM instead of OpenAI:

1. Download [LM Studio](https://lmstudio.ai/)
2. Download a model (recommended: `nvidia/nemotron-3-nano-4b`)
3. Start the local server (default: `http://localhost:1234`)
4. Configure in app settings: Settings → LM Studio

## Tech Stack

- Next.js 14 (App Router)
- Auth.js v5 (Google OAuth; optional Kakao and Naver)
- SQLite + Drizzle ORM
- shadcn/ui (Blue theme)
- Tailwind CSS
- OpenAI API / LM Studio

## Upgrading (existing `data/db.sqlite`)

Adds the `warnings` column when missing:

```bash
node scripts/migrate3.js
```

Skip on a fresh install until the app has created the DB.

## Docker (self-host)

1. `.env`를 프로젝트 루트에 두고 (`DATABASE_URL=file:./data/db.sqlite` 권장)
2. 실행:

```bash
docker compose up --build -d
```

3. `http://localhost:3000` — SQLite는 `briefing-data` 볼륨에 저장됩니다.

## Tests and CI

```bash
npm run lint
npm run typecheck
npm test
```

날짜·주간 범위는 `Asia/Seoul` 기준으로 `src/lib/korea-time`에서 검증합니다.

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests, and `npm run build` on pushes to `main` / `master` and on pull requests.

## License

MIT

### 안정 조합 (로컬 개발)

| 패키지 | 버전 |
|--------|------|
| Node | 20 |
| Next | 14 |
| React | 18 |
| TypeScript | 5 |
