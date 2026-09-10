import { getAllSnapshots } from "@/lib/adapters";
import { getActivityFeed } from "@/lib/mock/activity";

export async function GET() {
  const sources = await getAllSnapshots();

  return Response.json({
    sources,
    activity: getActivityFeed(sources),
    fetchedAt: new Date().toISOString(),
  });
}
