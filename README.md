# ShopAssist AI

ShopAssist AI is a full-stack customer support platform for e-commerce teams. It combines a React customer chat experience, a NestJS API, Supabase/PostgreSQL persistence, and a provider-based LLM layer that supports OpenAI, Anthropic, Gemini, and a local mock mode for development.

## Why this project exists

This project is designed to show the kind of practical engineering work a real product team would need for AI-enabled support automation:

- grounded customer support answers
- clean backend architecture
- conversation logging
- ticket escalation for unresolved issues
- production-minded configuration and error handling

## Features

- Customer-facing chat UI built with React, TypeScript, and Vite
- NestJS backend with modular services and controllers
- Provider-based AI layer with `OpenAI`, `Anthropic`, `Gemini`, and a local `mock` fallback for demos
- Knowledge base and product catalog grounding
- Conversation and message storage
- Support ticket creation when escalation is required
- Admin sign-in with Supabase Auth and backend-verified support access
- Admin action audit logging for ticket updates
- Simple admin dashboard with conversation and ticket summaries
- Input validation, health endpoint, and environment-based configuration
- Sample FAQ and product data under [`data/`](data)

## Tech stack

- Frontend: React, TypeScript, Vite, clean custom CSS
- Backend: NestJS, TypeScript
- Database: Supabase / PostgreSQL
- AI: OpenAI, Anthropic/Claude, Gemini, provider-based architecture
- Testing: Jest unit tests for backend chat flow
- CI: GitHub Actions for lint, typecheck, tests, and builds on PRs to `main`

## Architecture overview

### Frontend

- [`frontend/src/App.tsx`](frontend/src/App.tsx) serves the customer chat at `/` and protects the admin workspace at `/admin`.
- [`frontend/src/components/ChatPanel.tsx`](frontend/src/components/ChatPanel.tsx) manages chat state, loading, errors, and customer detail collection.
- [`frontend/src/components/DashboardPanel.tsx`](frontend/src/components/DashboardPanel.tsx) shows operational metrics and recent support activity.
- [`frontend/src/components/AdminAuthPanel.tsx`](frontend/src/components/AdminAuthPanel.tsx) handles support-team sign in and local account creation for approved emails.

### Backend

- [`backend/src/chat`](backend/src/chat) handles the main `POST /api/chat` workflow.
- [`backend/src/ai`](backend/src/ai) contains the provider interface and provider implementations.
- [`backend/src/knowledge-base`](backend/src/knowledge-base) ranks FAQ and product context for grounding.
- [`backend/src/conversation`](backend/src/conversation) stores and retrieves conversation history.
- [`backend/src/ticket`](backend/src/ticket) validates customer details and creates support tickets.
- [`backend/src/supabase`](backend/src/supabase) abstracts persistence with Supabase plus an in-memory fallback for local demo mode.
- [`backend/src/admin`](backend/src/admin) exposes the admin dashboard summary endpoint.
- [`backend/src/auth`](backend/src/auth) verifies Supabase access tokens and restricts admin routes to approved support accounts.
- [`backend/src/health`](backend/src/health) provides service health and runtime mode visibility.

### AI provider architecture

The controller never calls a model SDK directly. `ChatService` depends on `AiService`, which selects a provider based on environment variables:

- `AI_PROVIDER=openai`
- `AI_PROVIDER=anthropic`
- `AI_PROVIDER=gemini`
- `AI_PROVIDER=mock`

The common provider contract lives in [`backend/src/common/interfaces/ai-provider.interface.ts`](backend/src/common/interfaces/ai-provider.interface.ts). Adding another provider later only requires a new provider class and a small selection change in `AiService`.

## Project structure

```text
/frontend
/backend
/database
/data
/docs
```

## Database schema setup

Run the SQL in [`database/schema.sql`](database/schema.sql) inside Supabase SQL Editor or any PostgreSQL environment. The schema creates:

- `faq_articles`
- `products`
- `conversations`
- `messages`
- `support_tickets`
- `support_admin_emails`

## Local Supabase setup

This repo now includes a local Supabase project under [`supabase/`](supabase). From the repo root:

```bash
supabase start
supabase status
```

The local stack uses these ports to avoid conflicts with other Supabase projects:

- API: `http://127.0.0.1:55321`
- Postgres: `postgresql://postgres:postgres@127.0.0.1:55322/postgres`
- Studio: `http://127.0.0.1:55323`

Schema and sample FAQ/product data are applied automatically from:

- [`supabase/migrations/20250608121500_init_schema.sql`](supabase/migrations/20250608121500_init_schema.sql)
- [`supabase/migrations/20260613160000_add_admin_auth_and_rls.sql`](supabase/migrations/20260613160000_add_admin_auth_and_rls.sql)
- [`supabase/seed.sql`](supabase/seed.sql)

## Sample data and seeding

Sample JSON and CSV files live under:

- [`data/faqs/faqs.json`](data/faqs/faqs.json)
- [`data/faqs/faqs.csv`](data/faqs/faqs.csv)
- [`data/products/products.json`](data/products/products.json)
- [`data/products/products.csv`](data/products/products.csv)

To seed Supabase after creating the schema:

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. Run `npm install`
4. Run `npm run seed --workspace backend`

If Supabase is not configured, the backend still starts in a demo-friendly in-memory mode and loads FAQ/product context from the local JSON files.

## Running the project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

Set:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUPABASE_URL=http://127.0.0.1:55321
VITE_SUPABASE_ANON_KEY=your_publishable_key
VITE_ADMIN_ALLOW_SIGNUP=false
```

Backend:

```bash
cp backend/.env.example backend/.env
```

### 3. Start the backend

```bash
npm run dev:backend
```

Backend runs on `http://localhost:3000/api`.

### 4. Start the frontend

```bash
npm run dev:frontend
```

Frontend runs on `http://localhost:5173`.

## AI provider configuration

### OpenAI

Set these in `backend/.env`:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Anthropic / Claude

Set these in `backend/.env`:

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620
```

### Gemini

Set these in `backend/.env`:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Demo mode

For a no-key local demo:

```bash
AI_PROVIDER=mock
```

## Demo workflow

1. Open the frontend chat UI.
2. Ask a support question about shipping, returns, refunds, payments, account issues, orders, or products.
3. The backend retrieves relevant FAQ/product context and sends a grounded prompt to the configured AI provider.
4. Messages are stored with session ID, provider, model, timestamps, and response status.
5. If the request needs a human or refund review, the bot asks for `name`, `email`, and `issue summary`.
6. The customer fills the escalation form and clicks `Create support ticket`.
7. A support ticket is created with status `open`.
8. Open `/admin`, sign in with an approved support email, and inspect conversations and tickets.

## Admin access

The customer experience stays public at `/`. The support workspace is protected at `/admin`.

The local Supabase seed includes these approved support emails:

- `support@shopassist.local`
- `hana@shopassist.local`
- `samuel@shopassist.local`
- `meklit@shopassist.local`

For a production-like local setup, open sign-up is disabled by default.

To provision the first admin locally:

1. Add or keep the email in `support_admin_emails`
2. Create the auth user in Supabase Studio under `Authentication -> Users`
3. Sign in on `/admin`

If you explicitly want the older local self-sign-up flow for testing, set:

```bash
VITE_ADMIN_ALLOW_SIGNUP=true
```

and temporarily re-enable signups in [`supabase/config.toml`](supabase/config.toml).

Protection happens in two places:

- Supabase Auth verifies the session
- backend guards verify the email against `support_admin_emails`

RLS is enabled for the application tables, using `public.is_support_admin()` for authenticated admin access.

Customer-facing endpoints also include basic request rate limiting to reduce spam and abusive traffic.

## CI workflow

GitHub Actions is configured in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

It runs on every pull request targeting `main` and checks:

- linting
- TypeScript typechecking
- backend tests
- frontend and backend builds

Local equivalents:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Vercel deployment

This repo is ready for Vercel preview deployments for the frontend workspace.

Important setup:

- import the repo into Vercel
- set the **Root Directory** to `frontend`
- Vercel will use [`frontend/vercel.json`](frontend/vercel.json) so direct visits to `/admin` and other client-side routes still load the app

Recommended Vercel environment variables:

```bash
VITE_API_BASE_URL=https://your-backend-url/api
VITE_SUPABASE_URL=https://your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_ALLOW_SIGNUP=false
```

### Production and preview behavior

Once the GitHub repo is connected to Vercel:

- pushes to `main` can deploy the production frontend
- pull requests automatically get **Preview Deployments**
- those preview URLs are the easiest QA environment for reviewing UI changes before merge

### Backend deployment note

The current NestJS backend is not configured for direct Vercel deployment in this repo layout.

For a production-style setup:

- deploy the frontend to Vercel
- deploy the backend to a Node-friendly host such as Render, Railway, or Fly.io
- point `VITE_API_BASE_URL` in Vercel to that backend

### Recommended backend deployment: AWS EC2

This repo is prepared for an `EC2 + PM2 + Nginx` backend deployment.

Deployment assets included:

- [`docs/deployment-ec2.md`](docs/deployment-ec2.md)
- [`backend/ecosystem.config.cjs`](backend/ecosystem.config.cjs)
- [`backend/.env.production.example`](backend/.env.production.example)
- [`deploy/nginx/shopassist-api.conf`](deploy/nginx/shopassist-api.conf)

Recommended production shape:

- frontend on Vercel
- backend on EC2
- database and auth on Supabase

Minimum backend environment variables:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=https://your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

You can switch providers by changing:

- `AI_PROVIDER=openai` and `OPENAI_API_KEY`
- `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`
- `AI_PROVIDER=mock` for smoke testing without a live model

After the backend is live, update the Vercel frontend env:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Detailed EC2 steps are in [`docs/deployment-ec2.md`](docs/deployment-ec2.md).

### Alternative backend deployment

If you prefer a managed Node host instead of EC2, you can still deploy the backend to Render, Railway, or Fly.io and point the Vercel frontend to that API URL.

## API summary

- `POST /api/chat`
- `POST /api/tickets`
- `GET /api/health`
- `GET /api/admin/session`
- `GET /api/admin/dashboard`
- `GET /api/conversations/recent`
- `GET /api/conversations/:sessionId/messages`
- `GET /api/tickets/open`

## Screenshots

- Customer chat UI placeholder
- Admin dashboard placeholder
- Conversation history placeholder

## Capabilities

This project demonstrates:

- React + TypeScript frontend implementation
- NestJS backend architecture
- Supabase/PostgreSQL database design
- OpenAI, Claude, and Gemini-ready AI integration
- provider-based LLM architecture
- customer support automation workflows
- conversation storage and auditability
- support ticket creation
- backend API design
- production-minded error handling and validation

## Future improvements

- RLS policies for tenant and customer isolation
- pgvector / RAG search over larger support knowledge bases
- Slack or email notifications for new tickets
- n8n workflow integration for escalations and CRM sync
- Stripe subscription gate for SaaS-style monetization
- multilingual support
- expanded analytics dashboard
- voice agent version with Vapi, ElevenLabs, or Twilio
- deployment to Vercel, Render, or Railway

## Notes for MVP scope

- The in-memory fallback is for local demo convenience; persistent environments should use Supabase.
