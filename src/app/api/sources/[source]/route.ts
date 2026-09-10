import { getSnapshot, isAdapterSource } from "@/lib/adapters";

export async function GET(
  _request: Request,
  context: { params: Promise<{ source: string }> },
) {
  const { source } = await context.params;

  if (!isAdapterSource(source)) {
    return Response.json(
      { error: `Unknown source "${source}"` },
      { status: 404 },
    );
  }

  const snapshot = await getSnapshot(source);
  return Response.json(snapshot);
}
