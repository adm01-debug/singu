/**
 * Rate limiter + Circuit breaker for external API calls.
 * Prevents cascading failures and respects API rate limits.
 */

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

type CircuitState = 'closed' | 'open' | 'half-open';

class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor({ maxRequests, windowMs }: RateLimiterOptions) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return this.timestamps.length < this.maxRequests;
  }

  record(): void {
    this.timestamps.push(Date.now());
  }

  getRetryAfterMs(): number {
    if (this.timestamps.length === 0) return 0;
    const oldest = this.timestamps[0];
    return Math.max(0, this.windowMs - (Date.now() - oldest));
  }
}

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor({ failureThreshold, resetTimeoutMs }: CircuitBreakerOptions) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  canProceed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    // half-open: allow one request to test
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

interface ResilientApiOptions {
  rateLimiter?: RateLimiterOptions;
  circuitBreaker?: CircuitBreakerOptions;
}

const DEFAULT_RATE_LIMIT: RateLimiterOptions = { maxRequests: 10, windowMs: 60_000 };
const DEFAULT_CIRCUIT: CircuitBreakerOptions = { failureThreshold: 5, resetTimeoutMs: 30_000 };

class ResilientApi {
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;

  constructor(options: ResilientApiOptions = {}) {
    this.rateLimiter = new RateLimiter(options.rateLimiter ?? DEFAULT_RATE_LIMIT);
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker ?? DEFAULT_CIRCUIT);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.circuitBreaker.canProceed()) {
      throw new Error(`Circuit breaker is open. Retry after ${DEFAULT_CIRCUIT.resetTimeoutMs / 1000}s.`);
    }

    if (!this.rateLimiter.canProceed()) {
      const retryAfter = this.rateLimiter.getRetryAfterMs();
      throw new Error(`Rate limit exceeded. Retry after ${Math.ceil(retryAfter / 1000)}s.`);
    }

    this.rateLimiter.record();

    try {
      const result = await fn();
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }
}

// Named instances for different external services
const apiInstances = new Map<string, ResilientApi>();

export function getApiInstance(name: string, options?: ResilientApiOptions): ResilientApi {
  if (!apiInstances.has(name)) {
    apiInstances.set(name, new ResilientApi(options));
  }
  return apiInstances.get(name)!;
}

// Pre-configured instances for known services
export const lovableAi = getApiInstance('lovable-ai', {
  rateLimiter: { maxRequests: 5, windowMs: 60_000 },
  circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 60_000 },
});

export const firecrawl = getApiInstance('firecrawl', {
  rateLimiter: { maxRequests: 10, windowMs: 60_000 },
  circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30_000 },
});

export const enrichLayer = getApiInstance('enrich-layer', {
  rateLimiter: { maxRequests: 20, windowMs: 60_000 },
  circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30_000 },
});

export const evolutionApi = getApiInstance('evolution-api', {
  rateLimiter: { maxRequests: 30, windowMs: 60_000 },
  circuitBreaker: { failureThreshold: 10, resetTimeoutMs: 30_000 },
});
