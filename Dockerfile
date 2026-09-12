# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime-base
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs \
  /app/scripts/chat-smoke.mjs \
  /app/scripts/ollama-smoke.mjs \
  /app/scripts/ollama-warmup.mjs \
  /app/scripts/ollama-runtime.mjs \
  ./scripts/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

FROM runtime-base AS benchmark-runner

COPY --from=builder --chown=nextjs:nodejs \
  /app/scripts/recruiter-model-benchmark.mjs \
  /app/scripts/recruiter-model-benchmark-loader.mjs \
  /app/scripts/recruiter-model-benchmark-compare.mjs \
  ./scripts/
COPY --from=builder --chown=nextjs:nodejs \
  /app/src/data/chatEvidenceSources.ts \
  /app/src/data/projects.ts \
  /app/src/data/recruiterKnowledge.ts \
  ./src/data/
COPY --from=builder --chown=nextjs:nodejs /app/src/types/chat.ts ./src/types/chat.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/chatEvidence.ts ./src/lib/chatEvidence.ts
COPY --from=builder --chown=nextjs:nodejs \
  /app/src/lib/ai/benchmarks/recruiterModelBenchmark.ts \
  /app/src/lib/ai/benchmarks/recruiterModelBenchmarkCases.ts \
  /app/src/lib/ai/benchmarks/recruiterModelBenchmarkRunner.ts \
  ./src/lib/ai/benchmarks/
COPY --from=builder --chown=nextjs:nodejs \
  /app/src/lib/ai/jobDescriptionHeuristics.ts \
  /app/src/lib/ai/knowledgeRetriever.ts \
  /app/src/lib/ai/promptBuilder.ts \
  /app/src/lib/ai/recruiterAssessment.ts \
  /app/src/lib/ai/recruiterIntentGuard.ts \
  /app/src/lib/ai/recruiterPromptHistory.ts \
  /app/src/lib/ai/validation.ts \
  ./src/lib/ai/
USER root
RUN mkdir -p benchmark-results && chown nextjs:nodejs benchmark-results
USER nextjs

# Keep the default target minimal, including builds without --target.
FROM runtime-base AS runner
