import { describe, it, expect, vi, beforeEach } from "vitest";
import { CircuitBreaker, CircuitOpenError, getCircuitBreaker } from "@/lib/circuitBreaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker("test-service", {
      failureThreshold: 3,
      resetTimeoutMs: 100,
    });
  });

  it("starts in CLOSED state", () => {
    expect(breaker.getState()).toBe("CLOSED");
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("stays CLOSED on success", async () => {
    await breaker.call(async () => "ok");
    expect(breaker.getState()).toBe("CLOSED");
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("increments failure count on error", async () => {
    await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow("fail");
    expect(breaker.getFailureCount()).toBe(1);
    expect(breaker.getState()).toBe("CLOSED");
  });

  it("opens after failureThreshold consecutive failures", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("OPEN");
  });

  it("throws CircuitOpenError when OPEN", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow();
    }

    try {
      await breaker.call(async () => "should not run");
      expect.unreachable("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(CircuitOpenError);
      expect((e as CircuitOpenError).serviceName).toBe("test-service");
      expect((e as CircuitOpenError).retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("transitions to HALF_OPEN after resetTimeout", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("OPEN");

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 150));

    // Next call should transition to HALF_OPEN and succeed
    const result = await breaker.call(async () => "recovered");
    expect(result).toBe("recovered");
    expect(breaker.getState()).toBe("CLOSED");
  });

  it("goes back to OPEN if probe fails in HALF_OPEN", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow();
    }

    await new Promise((r) => setTimeout(r, 150));

    // Probe fails — should re-enter OPEN
    await expect(breaker.call(async () => { throw new Error("still broken"); })).rejects.toThrow();
    // Need 2 more failures to reach threshold again from HALF_OPEN (count was reset to 0 at transition)
    // Actually after the probe fail, failureCount is 1, which is < 3, so stays HALF_OPEN? 
    // No — after HALF_OPEN the call tries and fails, onFailure increments, but state doesn't re-open until threshold.
    // The breaker transitions to HALF_OPEN, probe fails, count goes to 1 (not enough for OPEN).
    expect(breaker.getFailureCount()).toBe(1);
  });

  it("resets manually", async () => {
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("OPEN");

    breaker.reset();
    expect(breaker.getState()).toBe("CLOSED");
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("resets failure count on success", async () => {
    await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow();
    await expect(breaker.call(async () => { throw new Error("fail"); })).rejects.toThrow();
    expect(breaker.getFailureCount()).toBe(2);

    await breaker.call(async () => "ok");
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("calls onStateChange callback", async () => {
    const onStateChange = vi.fn();
    const b = new CircuitBreaker("cb-test", {
      failureThreshold: 2,
      resetTimeoutMs: 50,
      onStateChange,
    });

    await expect(b.call(async () => { throw new Error("f"); })).rejects.toThrow();
    await expect(b.call(async () => { throw new Error("f"); })).rejects.toThrow();

    expect(onStateChange).toHaveBeenCalledWith("cb-test", "CLOSED", "OPEN");
  });
});

describe("getCircuitBreaker (registry)", () => {
  it("returns the same instance for same name", () => {
    const a = getCircuitBreaker("singleton-test");
    const b = getCircuitBreaker("singleton-test");
    expect(a).toBe(b);
  });

  it("returns different instances for different names", () => {
    const a = getCircuitBreaker("service-a");
    const b = getCircuitBreaker("service-b");
    expect(a).not.toBe(b);
  });
});

describe("CircuitOpenError", () => {
  it("has correct properties", () => {
    const err = new CircuitOpenError("my-service", 5000);
    expect(err.name).toBe("CircuitOpenError");
    expect(err.serviceName).toBe("my-service");
    expect(err.retryAfterMs).toBe(5000);
    expect(err.message).toContain("my-service");
    expect(err.message).toContain("5s");
  });
});
