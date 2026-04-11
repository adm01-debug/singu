import { describe, it, expect, vi, beforeEach } from "vitest";
import { resilientFetch } from "@/lib/resilientFetch";

describe("resilientFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns successful response on first try", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

    const result = await resilientFetch("https://api.test.com/data");
    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on 500 and succeeds", async () => {
    const failResponse = new Response("error", { status: 500 });
    const successResponse = new Response("ok", { status: 200 });

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(failResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await resilientFetch(
      "https://api.test.com/data",
      undefined,
      { maxRetries: 1, baseDelayMs: 10 }
    );
    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retries on 429 with Retry-After header", async () => {
    const rateLimited = new Response("rate limited", {
      status: 429,
      headers: { "Retry-After": "1" },
    });
    const success = new Response("ok", { status: 200 });

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(rateLimited)
      .mockResolvedValueOnce(success);

    const result = await resilientFetch(
      "https://api.test.com/data",
      undefined,
      { maxRetries: 1, baseDelayMs: 10 }
    );
    expect(result.status).toBe(200);
  });

  it("does NOT retry on 400 (client error)", async () => {
    const badRequest = new Response("bad request", { status: 400 });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(badRequest);

    const result = await resilientFetch(
      "https://api.test.com/data",
      undefined,
      { maxRetries: 2, baseDelayMs: 10 }
    );
    expect(result.status).toBe(400);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 401", async () => {
    const unauthorized = new Response("unauthorized", { status: 401 });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(unauthorized);

    const result = await resilientFetch(
      "https://api.test.com/data",
      undefined,
      { maxRetries: 2, baseDelayMs: 10 }
    );
    expect(result.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on network error and succeeds", async () => {
    const success = new Response("ok", { status: 200 });
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(success);

    const result = await resilientFetch(
      "https://api.test.com/data",
      undefined,
      { maxRetries: 1, baseDelayMs: 10 }
    );
    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws after all retries exhausted", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("net error 1"))
      .mockRejectedValueOnce(new TypeError("net error 2"))
      .mockRejectedValueOnce(new TypeError("net error 3"));

    await expect(
      resilientFetch("https://api.test.com/data", undefined, {
        maxRetries: 2,
        baseDelayMs: 10,
      })
    ).rejects.toThrow("net error 3");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry on AbortError", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(abortError);

    await expect(
      resilientFetch("https://api.test.com/data", undefined, {
        maxRetries: 2,
        baseDelayMs: 10,
      })
    ).rejects.toThrow("AbortError");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns last response when all retries fail with retryable status", async () => {
    const fail503 = new Response("unavailable", { status: 503 });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(fail503.clone())
      .mockResolvedValueOnce(fail503.clone())
      .mockResolvedValueOnce(fail503);

    const result = await resilientFetch(
      "https://api.test.com/data",
      undefined,
      { maxRetries: 2, baseDelayMs: 10 }
    );
    expect(result.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
