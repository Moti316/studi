/**
 * scripts/lib/bridge.ts — קריאה לגשר-NotebookLM (notebooklm-py CLI) עם SSL-fix.
 *
 * משותף לסקריפטי-ההפקה. `bridgeEnv` מגדיר SSL_CERT_FILE מ-CA-bundle (עוקף
 * TLS-inspection ארגוני · ראה BUGS.md#notebooklm-runtime-ssl). `askNotebook`
 * כותב prompt לקובץ-זמני ומריץ `ask --new --yes` (שיחה-טרייה פר-קריאה).
 *
 * ⚠️ סקריפט בלבד (child_process/fs). דורש tools/nblm-bridge/.venv + login.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
export const VENV_PYTHON = join(ROOT, 'tools', 'nblm-bridge', '.venv', 'Scripts', 'python.exe');
const CA_BUNDLE = join(ROOT, 'tools', 'nblm-bridge', '.cache-cabundle.pem');
const REQUESTS_DIR = join(ROOT, '.cache', 'notebooklm', 'requests');
const TMP_PROMPT = join(REQUESTS_DIR, '_tmp.txt');

/** env לתת-תהליך: PYTHONUTF8 + (אם קיים) SSL_CERT_FILE לעקיפת proxy-ארגוני. */
export function bridgeEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, PYTHONUTF8: '1' };
  if (existsSync(CA_BUNDLE)) {
    env['SSL_CERT_FILE'] = CA_BUNDLE;
    env['REQUESTS_CA_BUNDLE'] = CA_BUNDLE;
  }
  return env;
}

/**
 * שולח prompt למחברת ומחזיר את stdout הגולמי. `--new --yes` = שיחה-טרייה (מבטל
 * context-bloat). זורק אם ה-CLI נכשל/חרג-מ-timeout.
 */
export function askNotebook(prompt: string, notebookId: string, timeoutMs = 90_000): string {
  mkdirSync(REQUESTS_DIR, { recursive: true });
  writeFileSync(TMP_PROMPT, prompt, 'utf-8');
  return execFileSync(
    VENV_PYTHON,
    ['-m', 'notebooklm', 'ask', '--new', '--yes', '--prompt-file', TMP_PROMPT, '-n', notebookId],
    { encoding: 'utf-8', env: bridgeEnv(), timeout: timeoutMs },
  );
}
