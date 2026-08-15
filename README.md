# Portfolio 2026

Personal portfolio built with Next.js App Router and TypeScript, following a mobile-first and scalable architecture.

## Scripts

- `pnpm dev`: run development server.
- `pnpm build`: create production build.
- `pnpm start`: serve production build.
- `pnpm lint`: run ESLint.
- `pnpm test`: run the Vitest suite once.
- `pnpm test:chat-evals`: run deterministic recruiter-chat evaluations.
- `pnpm chat:smoke`: manually check one configured recruiter-chat response.
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

Cloudflare Workers AI is the primary provider and Ollama is the controlled fallback. Retrieval is local and deterministic. A normal request makes one Cloudflare attempt and, only when eligible, one Ollama attempt. The browser cannot choose or discover the answering provider.

Conversation history remains in browser `sessionStorage`. The server does not persist or log questions, answers, job descriptions, transcripts, prompts, raw request bodies, retrieved evidence content, IP addresses, or provider responses.

### Server-only configuration

For `pnpm dev`, copy `.env.example` to `.env.local`. Docker Compose reads an untracked `.env` file from the deployment checkout. Never commit these files, and never prefix AI credentials or private provider configuration with `NEXT_PUBLIC_`.

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_MODEL=@cf/zai-org/glm-4.7-flash

OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5-coder:3b
OLLAMA_REQUEST_TIMEOUT_MS=90000
OLLAMA_KEEP_ALIVE=2m
OLLAMA_MAX_CONCURRENT_REQUESTS=1
OLLAMA_FALLBACK_DAILY_LIMIT=25

CHAT_RATE_LIMIT_PER_MINUTE=8
CHAT_RATE_LIMIT_PER_DAY=40
CHAT_GLOBAL_DAILY_LIMIT=250
CHAT_ALLOWED_ORIGINS=https://marcespana.com,https://www.marcespana.com
CHAT_TELEMETRY_ENABLED=false
```

All variables are server-only:

- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are production-sensitive credentials. Together with `CLOUDFLARE_AI_MODEL`, all three are required to enable Cloudflare.
- `OLLAMA_MODEL` enables the fallback. The base URL, timeout, keep-alive, concurrency, and daily budget are optional bounded controls with conservative defaults.
- `OLLAMA_BASE_URL` is production-sensitive network configuration. It must resolve from the application container/runtime and must not expose Ollama publicly.
- The chat rate-limit variables are optional bounded controls. `CHAT_ALLOWED_ORIGINS` should include every additional trusted HTTPS origin.
- `CHAT_TELEMETRY_ENABLED` is optional and defaults to disabled. Set it to `true` only when structured operational logs are collected appropriately.

Missing provider configuration does not break installation, tests, or the production build. If neither provider is configured, `/api/chat` returns the existing generic `provider_unavailable` error without revealing which setting is missing.

Answers are grounded only in `src/data/recruiterKnowledge.ts`. Browser-provided assistant history remains untrusted transcript text and is never sent with a provider `assistant` or `system` role.

### Privacy-safe telemetry and readiness

When `CHAT_TELEMETRY_ENABLED=true`, the server writes centralized JSON operational events. Every event has the same short, random, server-generated request ID for internal correlation. Each provider attempt records only the internal provider name, success/failure outcome, bounded failure reason when applicable, and duration. A Cloudflare invalid response may additionally record only a bounded diagnostic code, validated finish reason, and bounded output-character count. Successful request events contain only query classification, final answering provider, total duration, provider duration, retrieved-entry count, and source count. Failure events contain only a bounded stage, safe reason, and total duration. Prompts, questions, answers, reasoning fields, response bodies, evidence content, credentials, and request IDs are never included in the public API response.

`GET /api/chat/health` makes no provider call and returns one uncached configuration-only status:

```json
{ "status": "ok" }
```

- `ok`: Cloudflare and Ollama appear configured.
- `degraded`: exactly one provider appears configured.
- `unavailable`: neither provider appears configured.

The health endpoint never returns credentials, models, account identifiers, or private URLs.

### Evaluations and manual smoke testing

`pnpm test` uses mocked providers and requires no AI credentials. `pnpm test:chat-evals` runs the deterministic bilingual recruiter corpus covering classification, retrieval, prompt isolation, unsupported claims, sources, and direct-contact privacy.

The real-provider smoke test is manual and is not run by CI or the build. Start the configured application, then run:

```bash
pnpm chat:smoke
pnpm chat:smoke:role-comparison
```

Set `CHAT_SMOKE_BASE_URL=https://your-deployment.example` to target a non-local deployment. The first command makes one fixed recruiter request; the second sends a fixed representative role description through the normal provider stack. Both validate only the bounded public response contract and print no prompt, answer, credentials, provider configuration, or response body.

From the deployed development container, run the representative role comparison with:

```bash
docker exec \
  -e CHAT_SMOKE_BASE_URL=https://test.marcespana.com \
  portfolio2026-dev \
  node scripts/chat-smoke.mjs --role-comparison
```

A successful fallback that runs inference on CPU can take noticeably longer than a Cloudflare response. This is expected when the bounded request completes successfully; the smoke command does not provide an ETA or provider progress.

### Private Ollama network and connectivity

Development and production portfolio containers join both the existing `traefik-proxy` network and the dedicated external `portfolio-ai` network. Deploy workflows create `portfolio-ai` as an internal Docker network when needed and attach the independently managed container named exactly `ollama` when it exists. Ollama stays outside this Compose project and must not have a public Traefik route or a `0.0.0.0:11434` port binding. A host-only `127.0.0.1:11434:11434` binding may remain for host administration; containers use private Docker DNS at `http://ollama:11434`.

After deployment, keep these non-secret values in the untracked VPS `.env` file:

```env
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5-coder:3b
OLLAMA_REQUEST_TIMEOUT_MS=90000
```

Safely inspect the runtime topology without printing environment values or provider output:

```bash
docker container ls -a --filter name=^/ollama$ --format '{{.Names}}'
docker network inspect portfolio-ai --format 'internal={{.Internal}} containers={{range .Containers}}{{.Name}} {{end}}'
docker container inspect portfolio2026-dev --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}'
docker container inspect portfolio2026-prod --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}'
docker exec portfolio2026-dev node scripts/ollama-smoke.mjs
docker exec portfolio2026-prod node scripts/ollama-smoke.mjs
```

Run the command for the deployed portfolio container. The smoke script sends only a harmless fixed prompt, validates a short bounded response, and prints PASS/FAIL without printing the configured URL, model, prompt, or response. Its success proves container-to-Ollama connectivity and inference for the configured model; repository unit tests alone do not.

From any shell where the same non-secret Ollama variables are already exported, the equivalent repository command is `pnpm chat:smoke:ollama`.

### Request protection and deployment

Rate limits, the Cloudflare failure cooldown, Ollama concurrency, and the Ollama daily fallback budget are process-local. They are intentionally not persisted and reset when the Node process restarts. Daily counters reset at midnight UTC. Running multiple Node processes gives each process its own counters, so use infrastructure-level protection if the deployment later scales horizontally.

The reverse proxy must overwrite `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For` with trusted connection data rather than accepting or appending visitor-controlled values. These headers are used only to form short-lived hashed rate-limit identifiers; they are not authentication. Restrict the Ollama listener to the private host/network and do not expose it directly to the public internet.

When an `Origin` header is present, `/api/chat` accepts only the request's own origin or an origin listed in `CHAT_ALLOWED_ORIGINS`. It does not emit permissive CORS headers. Invalid numeric environment values fall back to conservative defaults.

### Recruiter-chat production checklist

- [ ] Cloudflare account ID, API token, and model are configured server-side.
- [ ] The external `portfolio-ai` network reports `internal=true`, and both the portfolio and `ollama` containers belong to it.
- [ ] `OLLAMA_BASE_URL=http://ollama:11434` and `OLLAMA_MODEL=qwen2.5-coder:3b` are set in the untracked VPS `.env`.
- [ ] `OLLAMA_REQUEST_TIMEOUT_MS=90000` is set for the bounded CPU fallback window.
- [ ] `node scripts/ollama-smoke.mjs` passes from inside the deployed portfolio container.
- [ ] `CHAT_ALLOWED_ORIGINS` matches the deployed HTTPS origins.
- [ ] Per-minute, per-client daily, and global daily limits were reviewed.
- [ ] Ollama concurrency and fallback daily budget were reviewed.
- [ ] `CHAT_TELEMETRY_ENABLED` was deliberately enabled or disabled.
- [ ] `/api/chat/health` returns the expected status without configuration details.
- [ ] `pnpm test` and `pnpm test:chat-evals` pass without provider credentials.
- [ ] The production image/build completes without provider credentials.
- [ ] `pnpm chat:smoke` was run manually against the configured deployment.
- [ ] Repository, live-demo, LinkedIn, GitHub, CV, and digits-only WhatsApp links were checked.
