#!/usr/bin/env tsx
/**
 * Drive API sanity test.
 *
 * Usage:
 *   pnpm tsx scripts/test-drive.ts
 *
 * Expected output: metadata of "מאגר שאלות הכנה לוועדה - כללי - ספטמבר 2025"
 * + list of root folder contents.
 *
 * Prerequisites:
 *   1. `.env.local` has GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN
 *   2. The refresh-token was authorized for `drive.readonly` scope
 */

import 'dotenv/config';
import { DRIVE_ROOT_FOLDERS, getMetadata, listFolder } from '../src/lib/drive/client';

const SAMPLE_FILE_ID = '1BA9XpSDVNx-MVbiyQZCndeyMVROTZ0aG'; // "מאגר שאלות הכנה 2025"

async function main() {
  console.log('🔍 Drive API sanity test\n');

  // 1. Get sample file metadata
  console.log('Test 1: Get sample file metadata');
  console.log(`  File ID: ${SAMPLE_FILE_ID}`);
  const metadata = await getMetadata(SAMPLE_FILE_ID);
  console.log(`  ✅ Name: ${metadata.name}`);
  console.log(`  ✅ Type: ${metadata.mimeType}`);
  console.log(`  ✅ Size: ${Number(metadata.size) / 1024 / 1024} MB\n`);

  // 2. List root folder
  console.log('Test 2: List "ממונה בטיחות 2025" folder');
  const files = await listFolder(DRIVE_ROOT_FOLDERS.mainCourse);
  console.log(`  ✅ Found ${files.length} items:`);
  files.slice(0, 5).forEach((f) => {
    console.log(`     - ${f.name} (${f.mimeType})`);
  });
  if (files.length > 5) console.log(`     ... and ${files.length - 5} more\n`);

  console.log('\n✅ All tests passed. Drive API is working.');
}

main().catch((err) => {
  console.error('❌ Test failed:', err.message);
  if (err.code === 401) {
    console.error('\nHint: refresh token may be invalid or expired. Re-run auth setup.');
  }
  process.exit(1);
});
