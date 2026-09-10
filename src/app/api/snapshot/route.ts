import { getAllSnapshots } from "@/lib/adapters";
import { getActivityFeed } from "@/lib/mock/activity";

export async function GET() {
  const [sources] = await Promise.all([
    getAllSnapshots(),
    // Keep a little latency variance between polls so the UI feels alive.
    new Promise((resolve) => setTimeout(resolve, 40)),
  ]);

  return Response.json({
    sources,
    activity: getActivityFeed(),
    fetchedAt: new Date().toISOString(),
  });
}
