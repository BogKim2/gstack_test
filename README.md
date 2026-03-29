# Daily Briefing App

AI-powered daily calendar briefing with privacy-first design.

## Features

- Google Calendar integration
- AI-powered action item extraction (max 3 per day)
- Delta briefing (shows only changes from yesterday)
- Self-hostable with Docker
- LLM choice: OpenAI or LM Studio (local)

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
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

## LM Studio Setup (Optional)

If you want to use local LLM instead of OpenAI:

1. Download [LM Studio](https://lmstudio.ai/)
2. Download a model (recommended: `nvidia/nemotron-3-nano-4b`)
3. Start the local server (default: `http://localhost:1234`)
4. Configure in app settings: Settings → LM Studio

## Tech Stack

- Next.js 14 (App Router)
- Auth.js v5 (Google OAuth)
- SQLite + Drizzle ORM
- shadcn/ui (Blue theme)
- Tailwind CSS
- OpenAI API / LM Studio

## Docker (self-host)

1. `.env`를 프로젝트 루트에 두고 (`DATABASE_URL=file:./data/db.sqlite` 권장)
2. 실행:

```bash
docker compose up --build -d
```

3. `http://localhost:3000` — SQLite는 `briefing-data` 볼륨에 저장됩니다.

## Tests

```bash
npm test
```

날짜·주간 범위는 `Asia/Seoul` 기준으로 `src/lib/korea-time`에서 검증합니다.

## License

MIT

### 안정 조합 (로컬 개발)

| 패키지 | 버전 |
|--------|------|
| Node | 20 |
| Next | 14 |
| React | 18 |
| TypeScript | 5 |
