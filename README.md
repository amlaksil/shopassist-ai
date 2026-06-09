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
- Simple admin dashboard with conversation and ticket summaries
- Input validation, health endpoint, and environment-based configuration
- Sample FAQ and product data under [`data/`](data)

## Tech stack

- Frontend: React, TypeScript, Vite, clean custom CSS
- Backend: NestJS, TypeScript
- Database: Supabase / PostgreSQL
- AI: OpenAI, Anthropic/Claude, Gemini, provider-based architecture
- Testing: Jest unit tests for backend chat flow

## Architecture overview

### Frontend

- [`frontend/src/App.tsx`](frontend/src/App.tsx) switches between the customer chat and admin dashboard views.
- [`frontend/src/components/ChatPanel.tsx`](frontend/src/components/ChatPanel.tsx) manages chat state, loading, errors, and customer detail collection.
- [`frontend/src/components/DashboardPanel.tsx`](frontend/src/components/DashboardPanel.tsx) shows operational metrics and recent support activity.

### Backend

- [`backend/src/chat`](backend/src/chat) handles the main `POST /api/chat` workflow.
- [`backend/src/ai`](backend/src/ai) contains the provider interface and provider implementations.
- [`backend/src/knowledge-base`](backend/src/knowledge-base) ranks FAQ and product context for grounding.
- [`backend/src/conversation`](backend/src/conversation) stores and retrieves conversation history.
- [`backend/src/ticket`](backend/src/ticket) validates customer details and creates support tickets.
- [`backend/src/supabase`](backend/src/supabase) abstracts persistence with Supabase plus an in-memory fallback for local demo mode.
- [`backend/src/admin`](backend/src/admin) exposes the admin dashboard summary endpoint.
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
8. Switch to the admin dashboard view to inspect conversations, open tickets, issue categories, and failures.

## API summary

- `POST /api/chat`
- `POST /api/tickets`
- `GET /api/health`
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

- Supabase Auth for admin login
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

- Admin auth is intentionally omitted for the first version.
- Supabase Auth and Row Level Security are the recommended next steps before a production deployment.
- The in-memory fallback is for local demo convenience; persistent environments should use Supabase.
