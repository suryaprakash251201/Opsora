import { ingestAgentMetrics } from "@/lib/adapters/live/agent-store";
import { timingSafeEqual } from "node:crypto";
import { noStoreJson, readJsonBody } from "@/lib/server/api";

function unauthorized(): Response {
  return noStoreJson({ error: "Invalid agent token" }, { status: 401 });
}

/** Length-independent string comparison so token checks don't leak timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still burn a comparison on equal-length dummies to keep timing flat.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const expected = process.env.OPSORA_AGENT_TOKEN?.trim();
  if (expected) {
    const provided =
      request.headers.get("x-opsora-token") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!provided || !safeEqual(provided, expected)) return unauthorized();
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  try {
    const metrics = await ingestAgentMetrics(body.value);
    return noStoreJson({
      ok: true,
      hostname: metrics.hostname,
      receivedAt: metrics.receivedAt,
    });
  } catch (error) {
    return noStoreJson(
      { error: error instanceof Error ? error.message : "Invalid payload" },
      { status: 422 },
    );
  }
}
