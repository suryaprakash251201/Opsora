import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Device-independent GitHub preferences kept on the server so pinning a repo
 * survives browser changes and is included in backups. Values are `full_name`
 * strings (`owner/repo`).
 */
export interface GithubPrefs {
  pinned: string[];
  hidden: string[];
  updatedAt: string | null;
}

const MAX_ENTRIES = 200;

function dataDir(): string {
  return process.env.OPSORA_DATA_DIR ?? path.join(process.cwd(), ".data");
}

function prefsFile(): string {
  return path.join(dataDir(), "github-prefs.json");
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const name = entry.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
    if (result.length >= MAX_ENTRIES) break;
  }

  return result;
}

export function normalizeGithubPrefs(input: unknown): GithubPrefs {
  const raw =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  return {
    pinned: normalizeList(raw.pinned),
    hidden: normalizeList(raw.hidden),
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : null,
  };
}

export async function readGithubPrefs(): Promise<GithubPrefs> {
  try {
    const raw = await readFile(prefsFile(), "utf8");
    return normalizeGithubPrefs(JSON.parse(raw));
  } catch {
    return { pinned: [], hidden: [], updatedAt: null };
  }
}

export async function writeGithubPrefs(
  patch: { pinned?: unknown; hidden?: unknown },
): Promise<GithubPrefs> {
  const current = await readGithubPrefs();
  const next: GithubPrefs = {
    pinned: patch.pinned !== undefined ? normalizeList(patch.pinned) : current.pinned,
    hidden: patch.hidden !== undefined ? normalizeList(patch.hidden) : current.hidden,
    updatedAt: new Date().toISOString(),
  };

  const file = prefsFile();
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, JSON.stringify(next, null, 2), "utf8");
  await rename(temporary, file);

  return next;
}
