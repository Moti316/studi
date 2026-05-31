#!/usr/bin/env tsx
/**
 * One-time setup: get Google Drive refresh-token for offline access.
 *
 * Usage:
 *   pnpm drive:auth      (or: npx tsx scripts/auth-drive.ts)
 *
 * Flow (loopback / localhost — the supported method for Desktop OAuth clients):
 *   1. `.env.local` must have GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 *      (Google Cloud Console → APIs & Services → Credentials → Desktop app)
 *   2. Run this script. It starts a tiny local server on 127.0.0.1:53682
 *      and prints an auth URL.
 *   3. Open the URL → sign in with motilev8@gmail.com → Allow.
 *      ("Google hasn't verified this app" → Advanced → Continue — fine in Testing mode.)
 *   4. Google redirects back to the local server, which captures the code
 *      automatically — no manual copy/paste.
 *   5. The script exchanges the code, writes GOOGLE_REFRESH_TOKEN into `.env.local`,
 *      and prints it (so you can also add it to Vercel).
 *
 * Note: OOB (urn:ietf:wg:oauth:2.0:oob) was deprecated by Google in 2022 and is
 *       blocked for clients created after that — hence the loopback flow.
 */

import { config } from 'dotenv';
config({ path: '.env.local' }); // secrets live in .env.local (see README)
import { google } from 'googleapis';
import http from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;
const ENV_PATH = '.env.local';

async function main() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
    console.error('   Get them from: https://console.cloud.google.com/apis/credentials');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force refresh-token generation
    scope: SCOPES,
  });

  console.log('🔐 Open this URL in your browser and approve access:\n');
  console.log(authUrl);
  console.log('\n⏳ Waiting for the Google redirect on ' + REDIRECT_URI + ' ...\n');

  const code = await waitForCode();
  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      '❌ No refresh_token returned. Revoke the app at https://myaccount.google.com/permissions and re-run.',
    );
    process.exit(1);
  }

  writeRefreshToken(tokens.refresh_token);

  console.log('\n✅ Success! GOOGLE_REFRESH_TOKEN written to .env.local.\n');
  console.log('Also add this to Vercel → Environment Variables:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
}

/** Start a one-shot localhost server and resolve with the OAuth ?code=. */
function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', REDIRECT_URI);
      const code = url.searchParams.get('code');
      const err = url.searchParams.get('error');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      if (err) {
        res.statusCode = 400;
        res.end(`<html dir="rtl"><body><h2>שגיאה: ${err}</h2></body></html>`);
        server.close();
        reject(new Error(`OAuth error: ${err}`));
        return;
      }
      if (code) {
        res.end(
          '<html dir="rtl"><body style="font-family:sans-serif;text-align:center;margin-top:4rem">' +
            '<h2>✅ ההרשאה התקבלה!</h2><p>אפשר לסגור את החלון ולחזור לטרמינל.</p></body></html>',
        );
        server.close();
        resolve(code);
        return;
      }
      res.statusCode = 400;
      res.end('Missing code');
    });

    server.on('error', reject);
    server.listen(PORT, '127.0.0.1');

    // safety timeout — 5 minutes
    setTimeout(
      () => {
        server.close();
        reject(new Error('Timed out waiting for the OAuth callback (5 minutes).'));
      },
      5 * 60 * 1000,
    ).unref();
  });
}

/** Upsert GOOGLE_REFRESH_TOKEN into .env.local without touching other keys. */
function writeRefreshToken(token: string) {
  let content = readFileSync(ENV_PATH, 'utf8');
  const line = `GOOGLE_REFRESH_TOKEN=${token}`;
  if (/^GOOGLE_REFRESH_TOKEN=.*$/m.test(content)) {
    content = content.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line);
  } else {
    content += (content.endsWith('\n') ? '' : '\n') + line + '\n';
  }
  writeFileSync(ENV_PATH, content);
}

main().catch((err) => {
  console.error('❌ Auth failed:', err.message);
  process.exit(1);
});
