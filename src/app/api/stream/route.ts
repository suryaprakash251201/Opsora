import { getAllSnapshots } from "@/lib/adapters";
import type { SnapshotBundle } from "@/lib/adapters/types";
import { getActivityFeed, type ActivityEvent } from "@/lib/mock/activity";

const TICK_MS = 5_000;
const SHARE_WINDOW_MS = 4_000;

interface StreamPayload {
  sources: SnapshotBundle;
  activity: ActivityEvent[];
  fetchedAt: string;
}

let shared: { at: number; payload: StreamPayload } | null = null;
let sharedPending: Promise<StreamPayload> | null = null;

/**
 * All connected clients share one payload per tick window so N tabs don't
 * cause N snapshot recomputes.
 */
async function getSharedPayload(): Promise<StreamPayload> {
  if (shared && Date.now() - shared.at < SHARE_WINDOW_MS) {
    return shared.payload;
  }
  if (!sharedPending) {
    sharedPending = (async () => {
      // Keep a little latency variance between polls so the UI feels alive.
      const [sources] = await Promise.all([
        getAllSnapshots(),
        new Promise((resolve) => setTimeout(resolve, 40)),
      ]);
      return {
        sources,
        activity: getActivityFeed(),
        fetchedAt: new Date().toISOString(),
      };
    })();
  }

  try {
    const payload = await sharedPending;
    shared = { at: Date.now(), payload };
    return payload;
  } finally {
    sharedPending = null;
  }
}

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      const tick = async () => {
        try {
          send("snapshot", await getSharedPayload());
        } catch (error) {
          send("stream-error", {
            message:
              error instanceof Error ? error.message : "Stream update failed",
          });
        }
      };

      const abort = () => {
        closed = true;
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", abort);

      await tick();
      if (closed) return;
      timer = setInterval(() => {
        void tick();
      }, TICK_MS);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
