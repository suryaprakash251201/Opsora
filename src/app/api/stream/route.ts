import { getAllSnapshots } from "@/lib/adapters";
import { getActivityFeed } from "@/lib/mock/activity";

const TICK_MS = 5_000;

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
          const sources = await getAllSnapshots();
          send("snapshot", {
            sources,
            activity: getActivityFeed(),
            fetchedAt: new Date().toISOString(),
          });
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
