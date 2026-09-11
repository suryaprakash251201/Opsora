import { ingestAgentMetrics } from "@/lib/adapters/live/agent-store";
import { timingSafeEqual } from "node:crypto";

function unauthorized(): Response {
  return Response.json({ error: "Invalid agent token" }, { status: 401 });
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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  try {
    const metrics = await ingestAgentMetrics(payload);
    return Response.json({
      ok: true,
      hostname: metrics.hostname,
      receivedAt: metrics.receivedAt,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid payload" },
      { status: 422 },
    );
  }
}
