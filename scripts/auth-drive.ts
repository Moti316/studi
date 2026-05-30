#!/usr/bin/env tsx
/**
 * One-time setup: get Google Drive refresh-token for offline access.
 *
 * Usage:
 *   pnpm tsx scripts/auth-drive.ts
 *
 * Steps:
 *   1. Make sure `.env.local` has GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 *      (from Google Cloud Console → APIs & Services → Credentials)
 *   2. Run this script. It will print an auth URL.
 *   3. Open the URL in browser → sign in with motilev8@gmail.com → approve
 *   4. Copy the `code` param from the redirect URL
 *   5. Paste it back into the terminal
 *   6. Script prints GOOGLE_REFRESH_TOKEN — copy it to `.env.local`
 *
 * Note: The redirect URL is "urn:ietf:wg:oauth:2.0:oob" (out-of-band),
 *       which displays the code on a Google page instead of redirecting.
 *       Google deprecated OOB in 2022 but it still works for testing.
 *       If broken, use http://localhost:3000 as redirect_uri.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import * as readline from 'node:readline/promises';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'; // out-of-band (shows code on page)

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

  console.log('🔐 Step 1: Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n🔐 Step 2: Sign in with motilev8@gmail.com → Allow access');
  console.log('🔐 Step 3: Copy the code from the page (or URL ?code=...)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = (await rl.question('Paste the code here: ')).trim();
  rl.close();

  if (!code) {
    console.error('❌ No code provided');
    process.exit(1);
  }

  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      '❌ No refresh_token returned. Re-run and use a fresh consent (revoke previous app access first).',
    );
    process.exit(1);
  }

  console.log('\n✅ Success!\n');
  console.log('Add this line to your .env.local:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
}

main().catch((err) => {
  console.error('❌ Auth failed:', err.message);
  process.exit(1);
});
