import { buildDashboardSnapshot } from "@/lib/server/dashboard-snapshot";
import { noStoreJson, apiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return noStoreJson(await buildDashboardSnapshot());
  } catch (error) {
    return apiError(error);
  }
}
