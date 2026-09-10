import { ingestAgentMetrics } from "@/lib/adapters/live/agent-store";

function unauthorized(): Response {
  return Response.json({ error: "Invalid agent token" }, { status: 401 });
}

export async function POST(request: Request) {
  const expected = process.env.OPSORA_AGENT_TOKEN?.trim();
  if (expected) {
    const provided =
      request.headers.get("x-opsora-token") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (provided !== expected) return unauthorized();
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
