#!/usr/bin/env node
/**
 * Downloads the official Node.js runtime for the current platform and keeps
 * just the `node` / `node.exe` binary in `.node-runtime/`.
 *
 * The desktop installers bundle this binary as a Tauri resource so the
 * packaged app can boot its embedded server without requiring the user to
 * install Node.js. `scripts/desktop-stage.mjs` copies the binary into
 * `src-tauri/bundled-server/runtime/`, and `src-tauri/src/main.rs` prefers
 * it over any system Node.
 *
 * Usage:
 *   node scripts/fetch-node-runtime.mjs          # download if missing
 *   OPSORA_NODE_MAJOR=22 node scripts/...        # pin a release line (default)
 *   node scripts/fetch-node-runtime.mjs --check  # print path if cached
 */

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { get } from "node:https";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const exec = promisify(execFile);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cacheDir = path.join(root, ".node-runtime");
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "node.exe" : "node";
const binaryPath = path.join(cacheDir, binaryName);
const markerPath = path.join(cacheDir, "version.txt");

function log(message) {
  console.log(`[node-runtime] ${message}`);
}

/** nodejs.org dist slug for the running platform. */
function platformSlug() {
  const { platform, arch } = process;
  const archSlug = arch === "arm64" ? "arm64" : arch === "x64" ? "x64" : null;
  if (!archSlug) {
    throw new Error(`unsupported architecture: ${arch}`);
  }
  if (platform === "linux") return `linux-${archSlug}`;
  if (platform === "darwin") return `darwin-${archSlug}`;
  if (platform === "win32") return `win-${archSlug}`;
  throw new Error(`unsupported platform: ${platform}`);
}

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
      reject(new Error(`too many redirects for ${url}`));
      return;
    }
    get(url, { headers: { "user-agent": "opsora-desktop-build" } }, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        res.resume();
        resolve(fetchBuffer(new URL(res.headers.location, url).toString(), redirects + 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`GET ${url} → ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const request = get(
      url,
      { headers: { "user-agent": "opsora-desktop-build" } },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          resolve(
            downloadFile(new URL(res.headers.location, url).toString(), destination),
          );
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`GET ${url} → ${res.statusCode}`));
          return;
        }
        const file = createWriteStream(destination);
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
        file.on("error", reject);
      },
    );
    request.on("error", reject);
  });
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/** Parse SHASUMS256.txt into `{ filename: hash }`. */
function parseChecksums(text) {
  const map = new Map();
  for (const line of text.split("\n")) {
    const match = line.trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (match) map.set(match[2], match[1].toLowerCase());
  }
  return map;
}

function extract(archive, into) {
  // GNU tar (Linux/macOS) and bsdtar (Windows 10+) both auto-detect the
  // compression format, so one command covers .tar.xz and .zip.
  return exec("tar", ["-xf", archive, "-C", into], {
    maxBuffer: 1024 * 1024 * 64,
  });
}

function findExtractedBinary(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const nodeDir = entries.find(
    (entry) => entry.isDirectory() && entry.name.startsWith("node-v"),
  );
  if (!nodeDir) return null;
  const base = path.join(directory, nodeDir.name);
  const candidates = isWindows
    ? [path.join(base, "node.exe")]
    : [path.join(base, "bin", "node")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/**
 * Ensures `.node-runtime/node(.exe)` exists and matches the requested major
 * version. Returns the absolute path to the binary.
 */
export async function ensureNodeRuntime({ quiet = false } = {}) {
  const major = process.env.OPSORA_NODE_MAJOR?.trim() || "22";
  const expected = existsSync(markerPath)
    ? readFileSync(markerPath, "utf8").trim()
    : null;

  if (expected && existsSync(binaryPath) && expected.startsWith(`v${major}.`)) {
    if (!quiet) log(`cached ${expected} → ${binaryPath}`);
    return binaryPath;
  }

  const slug = platformSlug();
  const baseUrl = `https://nodejs.org/dist/latest-v${major}.x`;
  if (!quiet) log(`resolving latest Node ${major}.x for ${slug}…`);

  const checksums = parseChecksums(
    (await fetchBuffer(`${baseUrl}/SHASUMS256.txt`)).toString("utf8"),
  );

  const extension = isWindows ? "zip" : "tar.xz";
  const match = [...checksums.keys()].find(
    (name) => name.endsWith(`-${slug}.${extension}`),
  );
  if (!match) {
    throw new Error(`no Node ${major}.x build found for ${slug}`);
  }

  const version = match.slice(match.indexOf("v"), match.indexOf(`-${slug}`));
  const url = `${baseUrl}/${match}`;
  const tmpDir = path.join(os.tmpdir(), `opsora-node-${Date.now()}`);
  const archive = path.join(tmpDir, match);
  mkdirSync(tmpDir, { recursive: true });

  try {
    if (!quiet) log(`downloading ${url}`);
    await downloadFile(url, archive);

    const actual = sha256(archive);
    if (actual !== checksums.get(match)) {
      throw new Error(`checksum mismatch for ${match}`);
    }
    if (!quiet) log("checksum verified, extracting…");

    const extractDir = path.join(tmpDir, "extract");
    mkdirSync(extractDir, { recursive: true });
    await extract(archive, extractDir);

    const extracted = findExtractedBinary(extractDir);
    if (!extracted) {
      throw new Error("extracted archive did not contain a node binary");
    }

    mkdirSync(cacheDir, { recursive: true });
    copyFileSync(extracted, binaryPath);
    if (!isWindows) chmodSync(binaryPath, 0o755);
    writeFileSync(markerPath, `${version}\n`);

    if (!quiet) log(`${version} ready → ${binaryPath}`);
    return binaryPath;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  if (checkOnly && existsSync(binaryPath)) {
    log(binaryPath);
    return;
  }
  await ensureNodeRuntime();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[node-runtime] ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  });
}
