#!/usr/bin/env node
/**
 * Stages the desktop bundle: production-builds Next.js, then copies the
 * standalone server (server.js + traced node_modules + static assets +
 * public/) into `src-tauri/bundled-server/`, which Tauri ships as a
 * resource and boots on app launch (see src-tauri/src/main.rs).
 *
 * Run directly (`node scripts/desktop-stage.mjs`) or via Tauri's
 * beforeBuildCommand. Skips the rebuild with OPSORA_STAGE_SKIP_BUILD=1
 * when `.next/standalone/server.js` is already fresh.
 */

import { execFile } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standalone = path.join(root, ".next", "standalone");
const entry = path.join(standalone, "server.js");
const dest = path.join(root, "src-tauri", "bundled-server");

function log(message) {
  console.log(`[desktop-stage] ${message}`);
}

function copyIfExists(src, target) {
  if (!existsSync(src)) return false;
  const stat = statSync(src);
  if (stat.isDirectory()) {
    mkdirSync(target, { recursive: true });
    cpSync(src, target, { recursive: true });
  } else {
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(src, target);
  }
  return true;
}

if (!process.env.OPSORA_STAGE_SKIP_BUILD) {
  log("building Next.js (production)…");
  // On Windows `pnpm` is a .cmd shim, which execFile cannot spawn without a
  // shell.
  const isWindows = process.platform === "win32";
  await exec(isWindows ? "pnpm.cmd" : "pnpm", ["build"], {
    cwd: root,
    stdio: "inherit",
    shell: isWindows,
  });
} else {
  log("skipping Next.js build (OPSORA_STAGE_SKIP_BUILD=1)");
}

if (!existsSync(entry)) {
  console.error(
    `[desktop-stage] expected standalone server at ${entry} — did the build succeed with output: "standalone"?`,
  );
  process.exit(1);
}

log("staging standalone server → src-tauri/bundled-server/");
mkdirSync(dest, { recursive: true });
// Clear previous stage output but keep the .gitkeep placeholder so fresh
// clones (without a stage step) still satisfy Tauri's resource check.
for (const entryName of readdirSync(dest)) {
  if (entryName === ".gitkeep") continue;
  rmSync(path.join(dest, entryName), { recursive: true, force: true });
}

copyIfExists(entry, path.join(dest, "server.js"));
copyIfExists(path.join(standalone, "package.json"), path.join(dest, "package.json"));
copyIfExists(path.join(standalone, "node_modules"), path.join(dest, "node_modules"));
copyIfExists(path.join(standalone, ".next"), path.join(dest, ".next"));
// The Dockerfile copies these over standalone too — belt and braces so the
// staged server always has complete static assets and public files.
copyIfExists(path.join(root, ".next", "static"), path.join(dest, ".next", "static"));
copyIfExists(path.join(root, "public"), path.join(dest, "public"));

/* ------------------------------------------------------------------ */
/* Bundled Node.js runtime                                             */
/* ------------------------------------------------------------------ */

// The packaged app boots the server itself, so it must not depend on the
// user having Node.js installed. `fetch-node-runtime.mjs` downloads the
// official binary (cached in .node-runtime/), and we ship it as a resource.
if (process.env.OPSORA_BUNDLE_NODE !== "0") {
  try {
    const { ensureNodeRuntime } = await import("./fetch-node-runtime.mjs");
    const nodeBinary = await ensureNodeRuntime({ quiet: true });
    const target = path.join(
      dest,
      "runtime",
      process.platform === "win32" ? "node.exe" : "node",
    );
    copyIfExists(nodeBinary, target);
    log(`bundled Node runtime → ${path.relative(root, target)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.OPSORA_REQUIRE_NODE_RUNTIME === "1") {
      console.error(`[desktop-stage] failed to bundle Node runtime: ${message}`);
      process.exit(1);
    }
    console.warn(`[desktop-stage] could not bundle Node runtime: ${message}`);
    console.warn(
      "[desktop-stage] installers will fall back to a system Node.js 22+ (set OPSORA_REQUIRE_NODE_RUNTIME=1 to make this fatal)",
    );
  }
} else {
  log("skipping bundled Node runtime (OPSORA_BUNDLE_NODE=0)");
}

log("done. Run `pnpm desktop:build` to produce installers.");
