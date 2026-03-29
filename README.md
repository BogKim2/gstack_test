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

- Next.js 15 (App Router)
- Auth.js v5 (Google OAuth)
- SQLite + Drizzle ORM
- shadcn/ui (Neutral theme)
- Tailwind CSS
- OpenAI API / LM Studio

## License

MIT


목적을 describe 하고 서 다음을 실행

/office-hours

/plan-ceo-review
        [reads the design doc, challenges scope, runs 10-section review]

/plan-eng-review
        [ASCII diagrams for data flow, state machines, error paths]
        [test matrix, failure modes, security concerns]
/plan_design_review


/ship
Approve plan. Exit plan mode.
        [writes 2,400 lines across 11 files. ~8 minutes.]

/review
        [AUTO-FIXED] 2 issues. [ASK] Race condition → you approve fix.

/qa https://staging.myapp.com
        [opens real browser, clicks through flows, finds and fixes a bug]

/ship
        Tests: 42 → 51 (+9 new). PR: github.com/you/app/pull/42



📊 안정 조합 (중요🔥)
패키지	버전
Node	20
Next	14
React	18
TypeScript	5

