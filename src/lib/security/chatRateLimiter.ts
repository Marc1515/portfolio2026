import "server-only";

const DEFAULT_PER_MINUTE = 8;
const DEFAULT_PER_DAY = 40;
const DEFAULT_GLOBAL_PER_DAY = 250;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

interface ClientUsage {
  minuteWindow: number;
  minuteCount: number;
  day: string;
  dayCount: number;
  lastSeen: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

interface ChatRateLimiterOptions {
  perMinute?: number;
  perDay?: number;
  globalPerDay?: number;
  now?: () => number;
  staleEntryMs?: number;
  cleanupIntervalMs?: number;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function utcDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function secondsUntilNextUtcDay(timestamp: number): number {
  const date = new Date(timestamp);
  const nextDay = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((nextDay - timestamp) / 1_000));
}

export class ChatRateLimiter {
  private readonly clients = new Map<string, ClientUsage>();
  private readonly perMinute: number;
  private readonly perDay: number;
  private readonly globalPerDay: number;
  private readonly now: () => number;
  private readonly staleEntryMs: number;
  private readonly cleanupIntervalMs: number;
  private lastCleanup = 0;
  private globalDay: string;
  private globalCount = 0;

  constructor(options: ChatRateLimiterOptions = {}) {
    this.perMinute = options.perMinute ?? DEFAULT_PER_MINUTE;
    this.perDay = options.perDay ?? DEFAULT_PER_DAY;
    this.globalPerDay = options.globalPerDay ?? DEFAULT_GLOBAL_PER_DAY;
    this.now = options.now ?? Date.now;
    this.staleEntryMs = options.staleEntryMs ?? 2 * DAY_MS;
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? MINUTE_MS;
    this.globalDay = utcDay(this.now());
  }

  static fromEnvironment(
    environment: NodeJS.ProcessEnv = process.env,
    now: () => number = Date.now,
  ) {
    return new ChatRateLimiter({
      perMinute: positiveInteger(
        environment.CHAT_RATE_LIMIT_PER_MINUTE,
        DEFAULT_PER_MINUTE,
      ),
      perDay: positiveInteger(
        environment.CHAT_RATE_LIMIT_PER_DAY,
        DEFAULT_PER_DAY,
      ),
      globalPerDay: positiveInteger(
        environment.CHAT_GLOBAL_DAILY_LIMIT,
        DEFAULT_GLOBAL_PER_DAY,
      ),
      now,
    });
  }

  check(clientIdentifier: string): RateLimitResult {
    const timestamp = this.now();
    this.cleanup(timestamp);
    const day = utcDay(timestamp);
    const minuteWindow = Math.floor(timestamp / MINUTE_MS) * MINUTE_MS;

    if (day !== this.globalDay) {
      this.globalDay = day;
      this.globalCount = 0;
    }

    const previous = this.clients.get(clientIdentifier);
    const usage: ClientUsage = previous ?? {
      minuteWindow,
      minuteCount: 0,
      day,
      dayCount: 0,
      lastSeen: timestamp,
    };

    if (usage.minuteWindow !== minuteWindow) {
      usage.minuteWindow = minuteWindow;
      usage.minuteCount = 0;
    }
    if (usage.day !== day) {
      usage.day = day;
      usage.dayCount = 0;
    }
    usage.lastSeen = timestamp;
    this.clients.set(clientIdentifier, usage);

    const retryAfterCandidates: number[] = [];
    if (usage.minuteCount >= this.perMinute) {
      retryAfterCandidates.push(
        Math.max(1, Math.ceil((minuteWindow + MINUTE_MS - timestamp) / 1_000)),
      );
    }
    if (usage.dayCount >= this.perDay) {
      retryAfterCandidates.push(secondsUntilNextUtcDay(timestamp));
    }
    if (this.globalCount >= this.globalPerDay) {
      retryAfterCandidates.push(secondsUntilNextUtcDay(timestamp));
    }

    if (retryAfterCandidates.length > 0) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(...retryAfterCandidates),
      };
    }

    usage.minuteCount += 1;
    usage.dayCount += 1;
    this.globalCount += 1;
    return { allowed: true };
  }

  get clientCount(): number {
    return this.clients.size;
  }

  private cleanup(timestamp: number) {
    if (timestamp - this.lastCleanup < this.cleanupIntervalMs) return;

    const cutoff = timestamp - this.staleEntryMs;
    for (const [identifier, usage] of this.clients) {
      if (usage.lastSeen < cutoff) this.clients.delete(identifier);
    }
    this.lastCleanup = timestamp;
  }
}
