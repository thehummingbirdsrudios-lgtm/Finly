/**
 * New-password rules (NIST SP 800-63B §5.1.1.2): length over composition, no forced character classes, refuse values
 * that are trivially guessable for this account. Messages are shown to the person, so they say what to change.
 */
import { fail } from '../../domain/errors.ts';

export const MIN_PASSWORD = 10;
export const MAX_PASSWORD = 128;

/** A short list of passwords attackers try first; the length rule already rules out most others. */
const COMMON = new Set([
  'password12',
  'password123',
  'passw0rd123',
  '1234567890',
  '0123456789',
  '12345678910',
  'qwertyuiop',
  'asdfghjkl1',
  'iloveyou12',
  'finly12345',
  'welcome123',
  'admin12345',
  'abcd123456',
  '1qaz2wsx3edc',
  'qwerty12345',
]);

export function checkNewPassword(password: string, username: string, previous?: string): void {
  const p = password.normalize('NFC');
  const field = { field: 'newPassword' };
  if ([...p].length < MIN_PASSWORD) fail('VALIDATION', `Use at least ${MIN_PASSWORD} characters.`, field);
  if ([...p].length > MAX_PASSWORD) fail('VALIDATION', `Use at most ${MAX_PASSWORD} characters.`, field);
  const lower = p.toLowerCase();
  if (new Set([...p]).size < 4) fail('VALIDATION', 'Use more different characters.', field);
  if (lower.includes(username.toLowerCase())) fail('VALIDATION', 'Do not include your username.', field);
  if (COMMON.has(lower)) fail('VALIDATION', 'That password is too common. Choose another.', field);
  if (/^(.+?)\1+$/.test(p)) fail('VALIDATION', 'Do not repeat the same pattern.', field);
  if (previous !== undefined && previous.normalize('NFC') === p) {
    fail('VALIDATION', 'Choose a password different from the current one.', field);
  }
}
