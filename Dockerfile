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

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src/data ./src/data
COPY --from=builder --chown=nextjs:nodejs /app/src/types ./src/types
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
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p .next/cache benchmark-results && chown -R nextjs:nodejs .next benchmark-results

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
