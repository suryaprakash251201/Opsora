import { readFileSync } from "node:fs";
import path from "node:path";

let cached: string | null = null;

export function readPackageVersion(): string {
  if (cached) return cached;
  try {
    const raw = readFileSync(
      path.join(process.cwd(), "package.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { version?: unknown };
    cached = typeof parsed.version === "string" ? parsed.version : "0.0.0";
  } catch {
    cached = "0.0.0";
  }
  return cached;
}

/** Server-only: bypass the cache so a version change is picked up live. */
export function readPackageVersionFresh(): string {
  cached = null;
  return readPackageVersion();
}
