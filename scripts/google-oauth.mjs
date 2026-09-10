#!/usr/bin/env node
/**
 * Obtains a Google OAuth refresh token for the Opsora calendar adapter.
 *
 * 1. In Google Cloud Console create an OAuth client of type "Desktop app".
 * 2. Run:
 *      GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-oauth.mjs
 * 3. Open the printed URL, approve access, then copy the values into .env.local.
 */

import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before running this script.",
  );
  process.exit(1);
}

const port = Number(process.env.OPSORA_OAUTH_PORT ?? 53682);
const redirectUri = `http://localhost:${port}`;
const scope = "https://www.googleapis.com/auth/calendar.readonly";

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
  {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
  },
).toString()}`;

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", redirectUri);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error) {
    response.end(`Authorization failed: ${error}. Check the terminal.`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    response.writeHead(404).end("Waiting for the OAuth callback…");
    return;
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.refresh_token) {
      throw new Error(JSON.stringify(tokens));
    }

    response.end("Done! Close this tab and return to the terminal.");

    console.log("\nAdd these lines to .env.local:\n");
    console.log(`GOOGLE_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (tokenError) {
    response.end("Token exchange failed — check the terminal.");
    console.error(tokenError instanceof Error ? tokenError.message : tokenError);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(port, () => {
  console.log(`Open this URL to authorize Opsora:\n\n${authUrl}\n`);
  exec("xdg-open", [authUrl]).catch(() => {
    // Headless machine: the URL is already printed above.
  });
});
