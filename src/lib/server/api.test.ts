import { describe, expect, it } from "vitest";
import { apiError, noStoreJson, readJsonBody } from "./api";

describe("noStoreJson", () => {
  it("sets Cache-Control: no-store", async () => {
    const response = noStoreJson({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("preserves an explicit status", () => {
    expect(noStoreJson({ error: "nope" }, { status: 404 }).status).toBe(404);
  });
});

describe("apiError", () => {
  it("maps Error to its message with no-store", async () => {
    const response = apiError(new Error("boom"));
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "boom" });
  });

  it("hides non-Error values behind a generic message", async () => {
    const response = apiError("weird", 502);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});

describe("readJsonBody", () => {
  it("returns the parsed value for valid JSON", async () => {
    const result = await readJsonBody(
      new Request("http://x/", {
        method: "PUT",
        body: JSON.stringify({ todos: [] }),
      }),
    );
    expect(result).toEqual({ ok: true, value: { todos: [] } });
  });

  it("returns a 400 no-store response for malformed JSON", async () => {
    const result = await readJsonBody(
      new Request("http://x/", { method: "PUT", body: "{nope" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    expect(result.response.headers.get("Cache-Control")).toBe("no-store");
    expect(await result.response.json()).toEqual({
      error: "Body must be valid JSON",
    });
  });
});
