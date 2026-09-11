import { getAllSnapshots } from "@/lib/adapters";
import { getActivityFeed } from "@/lib/activity";
import { noStoreJson, apiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = await getAllSnapshots();

    return noStoreJson({
      sources,
      activity: getActivityFeed(sources),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
