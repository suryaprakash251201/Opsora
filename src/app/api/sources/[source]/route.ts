import { getSnapshot, isAdapterSource } from "@/lib/adapters";
import { noStoreJson, apiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ source: string }> },
) {
  try {
    const { source } = await context.params;

    if (!isAdapterSource(source)) {
      return noStoreJson(
        { error: `Unknown source "${source}"` },
        { status: 404 },
      );
    }

    const snapshot = await getSnapshot(source);
    return noStoreJson(snapshot);
  } catch (error) {
    return apiError(error);
  }
}
