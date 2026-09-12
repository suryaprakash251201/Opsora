import {
  readGithubPrefs,
  writeGithubPrefs,
} from "@/lib/server/github-prefs";
import { noStoreJson, apiError, readJsonBody } from "@/lib/server/api";

export const dynamic = "force-dynamic";

/** GET /api/github/prefs — pinned/hidden repositories. */
export async function GET() {
  try {
    return noStoreJson(await readGithubPrefs());
  } catch (error) {
    return apiError(error);
  }
}

/** PUT /api/github/prefs — merge pinned/hidden repository lists. */
export async function PUT(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const payload = body.value;

  if (typeof payload !== "object" || payload === null) {
    return noStoreJson({ error: "Body must be a JSON object" }, { status: 400 });
  }

  try {
    const prefs = await writeGithubPrefs(
      payload as { pinned?: unknown; hidden?: unknown },
    );
    return noStoreJson(prefs);
  } catch (error) {
    return apiError(error);
  }
}
