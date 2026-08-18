import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { ActionError } from "@/lib/action";

const REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS ?? 10);
const WINDOW = process.env.RATE_LIMIT_WINDOW ?? "1 h";

// Not configured locally? Skip the check rather than crash the app on import.
const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const ratelimit = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(REQUESTS, WINDOW),
      prefix: "fortuno",
      analytics: true,
    })
  : null;

// Call right after requireUser(), passing the app user id — the limit should
// follow the account, not an IP that changes on every mobile network hop.
export async function requireWithinRateLimit(identifier) {
  if (!ratelimit) return;

  let allowed = true;

  try {
    const { success } = await ratelimit.limit(identifier);
    allowed = success;
  } catch (error) {
    // Fail open: Redis being unreachable must not stop people using the app.
    console.error("Rate limit check failed:", error);
    return;
  }

  if (!allowed) {
    throw new ActionError("Too many requests. Please try again later.");
  }
}
