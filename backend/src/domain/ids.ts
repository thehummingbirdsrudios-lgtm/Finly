/**
 * Identifiers. Internal ids are UUIDv7 (time-ordered, random tail from the platform CSPRNG). Human references for
 * master events read `TX-YYYYMMDD-NNNNNN`; the sequence part is assigned by the database at posting time.
 */
export type Id = string;

export function uuidv7(now: number = Date.now()): Id {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const ms = BigInt(now);
  for (let i = 0; i < 6; i++) bytes[i] = Number((ms >> BigInt(8 * (5 - i))) & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** `TX-20261008-001245` for posting date 2026-10-08 and sequence 1245. */
export function txReference(dateIso: string, sequence: number): string {
  const ymd = dateIso.slice(0, 10).replaceAll('-', '');
  return `TX-${ymd}-${String(sequence).padStart(6, '0')}`;
}
