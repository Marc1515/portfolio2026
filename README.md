# Portfolio 2026

Personal portfolio built with Next.js App Router and TypeScript, following a mobile-first and scalable architecture.

## Scripts

- `pnpm dev`: run development server.
- `pnpm build`: create production build.
- `pnpm start`: serve production build.
- `pnpm lint`: run ESLint.
- `pnpm test`: run the Vitest suite once.
- `pnpm test:watch`: run Vitest in watch mode.

## Architecture

- `src/app`: App Router entries, layout and global styles.
- `src/components/ui`: generic reusable UI primitives (`Section`).
- `src/components/layout`: layout components (`Header`, `Footer`, `Container`).
- `src/components/sections`: top-level page sections.
- `src/components/features`: domain components grouped by feature.
- `src/data`: typed content separated from UI.
- `src/types`: domain type contracts.
- `src/lib`: shared constants and utility helpers.

## Content Maintenance

Update portfolio content without touching UI by editing:

- `src/data/site.ts`
- `src/data/projects.ts`
- `src/data/experience.ts`
- `src/data/contact.ts`

All files are validated by TypeScript through `satisfies` and strict typing.

## Conventions

- Prefer Server Components. Add `'use client'` only when browser APIs or interactivity require it.
- Avoid `any` (explicit and implicit) and keep strict TypeScript enabled.
- Keep `sections` focused on composition and move reusable pieces into `ui` or `features`.
- Reuse `Section` for shared section structure (id, spacing, headings, container).
- Keep domain data serializable and independent from JSX to ease future migration to CMS/API.

## Run locally

1. Install dependencies: `pnpm install`
2. Start development server: `pnpm dev`
3. Open `http://localhost:3000`

## Recruiter AI chat

The bilingual recruiter chat answers questions about Marc's verified professional experience, projects, skills, education, languages, availability, and public contact options. It can also compare the curated profile with a role description while clearly identifying unsupported requirements.

Cloudflare Workers AI is the primary provider. Ollama can be configured as a controlled fallback. Copy `.env.example` to `.env.local` and configure the providers you operate:

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_MODEL=@cf/zai-org/glm-4.7-flash

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=
OLLAMA_REQUEST_TIMEOUT_MS=30000
OLLAMA_KEEP_ALIVE=2m
OLLAMA_MAX_CONCURRENT_REQUESTS=1
OLLAMA_FALLBACK_DAILY_LIMIT=25
```

Then run `pnpm dev` and open `/en` or `/es`. Credentials, provider URLs, and model names remain server-side. Missing provider configuration does not break the production build; if no allowed provider can answer, the API returns a generic unavailable response. Ollama is called at most once and only after the primary provider is unavailable. Its base URL is normalized before the fixed `/api/chat` endpoint is added.

Answers are grounded only in the curated professional information in `src/data/recruiterKnowledge.ts`. Conversation history is kept in the visitor's `sessionStorage` and is not persisted on the server. Client-supplied assistant history is always converted to a clearly marked, untrusted transcript and is never forwarded with a provider `assistant` or `system` role.

Run `pnpm test` for credential-free provider tests with mocked network responses. To exercise Cloudflare alone, configure its three variables and leave `OLLAMA_MODEL` empty. To exercise Ollama fallback, configure a local/private Ollama service and model, then leave the Cloudflare credentials empty or make the primary unavailable. A real provider check requires valid Cloudflare credentials or a running Ollama service; the browser never receives provider names, credentials, URLs, models, or raw provider errors.

### Request protection and deployment

The dependency-free limits default to:

```env
CHAT_RATE_LIMIT_PER_MINUTE=8
CHAT_RATE_LIMIT_PER_DAY=40
CHAT_GLOBAL_DAILY_LIMIT=250
CHAT_ALLOWED_ORIGINS=https://marcespana.com,https://www.marcespana.com
```

Rate limits, the Cloudflare failure cooldown, Ollama concurrency, and the Ollama daily fallback budget are process-local. They are intentionally not persisted and reset when the Node process restarts. Daily counters reset at midnight UTC. Running multiple Node processes gives each process its own counters, so use infrastructure-level protection if the deployment later scales horizontally.

The reverse proxy must overwrite `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For` with trusted connection data rather than accepting or appending visitor-controlled values. These headers are used only to form short-lived hashed rate-limit identifiers; they are not authentication. Restrict the Ollama listener to the private host/network and do not expose it directly to the public internet.

When an `Origin` header is present, `/api/chat` accepts only the request's own origin or an origin listed in `CHAT_ALLOWED_ORIGINS`. It does not emit permissive CORS headers. Invalid numeric environment values fall back to conservative defaults.
