/**
 * Google Drive API client wrapper.
 *
 * Used by `scripts/import-t1.ts`, `scripts/import-t2.ts`, etc.
 * Scope: `drive.readonly` only (we read user's Drive content).
 *
 * Auth flow: OAuth 2.0 with offline refresh-token (long-lived).
 * Credentials in `.env.local`:
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 *   - GOOGLE_REFRESH_TOKEN (one-time setup via `scripts/auth-drive.ts`)
 */

import type { drive_v3 } from 'googleapis';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

let cachedClient: drive_v3.Drive | null = null;

/** Get authenticated Drive client (cached singleton). */
export function getDriveClient(): drive_v3.Drive {
  if (cachedClient) return cachedClient;

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      'Missing Google credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env.local',
    );
  }

  const oauth2: OAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  cachedClient = google.drive({ version: 'v3', auth: oauth2 });
  return cachedClient;
}

/** List files in a Drive folder (non-recursive). */
export async function listFolder(folderId: string) {
  const drive = getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
    pageSize: 200,
  });
  return res.data.files ?? [];
}

/** Get file metadata. */
export async function getMetadata(fileId: string) {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,size,modifiedTime,parents,createdTime,webViewLink',
  });
  return res.data;
}

/** Download file content as Buffer (binary-safe). */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data as ArrayBuffer);
}

/**
 * Export Google Docs / Sheets / Slides as a different format.
 * For Drive native types only (not PDFs etc).
 */
export async function exportFile(
  fileId: string,
  mimeType:
    | 'application/pdf'
    | 'text/plain'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.export({ fileId, mimeType }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data as ArrayBuffer);
}

// ─── Drive folder IDs from content-inventory.md ──────────────────────
export const DRIVE_ROOT_FOLDERS = {
  /** ממונה בטיחות 2025 */
  mainCourse: '1pQQcc-PCzG5QXtPOspIGbThVDcDgfXSI',
  /** ממונה בטיחות (additional materials + question banks) */
  legacy: '1Cd4iydy7aqUqO6C745j9lGIsHsFXpWfH',
  /** חומרי לימוד (sub-folder of mainCourse) */
  learningMaterials: '1Xr170fcoD-MUD0_3WtqMuN7Eqz6oBVbT',
} as const;
