// btoa/atob are unavailable in RN; dependency-free base64url for JWT payloads.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const DECODE: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) DECODE[ALPHABET[i]] = i;

export function bytesToBase64url(bytes: Uint8Array): string {
  // Convert to binary string in chunks to avoid huge call-stack
  // recursion on `String.fromCharCode.apply`.
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + CHUNK)) as number[],
    );
  }
  let out = '';
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    const triplet = (a << 16) | (b << 8) | c;
    out += ALPHABET[(triplet >> 18) & 0x3f];
    out += ALPHABET[(triplet >> 12) & 0x3f];
    out += i + 1 < binary.length ? ALPHABET[(triplet >> 6) & 0x3f] : '';
    out += i + 2 < binary.length ? ALPHABET[triplet & 0x3f] : '';
  }
  return out;
}

export function base64urlToString(s: string): string {
  let std = s.replace(/-/g, '+').replace(/_/g, '/');
  while (std.length % 4) std += '=';
  let binary = '';
  for (let i = 0; i < std.length; i += 4) {
    const a = DECODE[std[i]] ?? 0;
    const b = DECODE[std[i + 1]] ?? 0;
    const c = DECODE[std[i + 2]] ?? 0;
    const d = DECODE[std[i + 3]] ?? 0;
    const triplet = (a << 18) | (b << 12) | ((c & 0x3f) << 6) | (d & 0x3f);
    binary += String.fromCharCode((triplet >> 16) & 0xff);
    if (std[i + 2] !== '=') binary += String.fromCharCode((triplet >> 8) & 0xff);
    if (std[i + 3] !== '=') binary += String.fromCharCode(triplet & 0xff);
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
