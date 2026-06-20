// Custom scheme only (smaran://join); universal https links need domain setup — see app/join.tsx.
import Constants from 'expo-constants';

function scheme(): string {
  const s = Constants.expoConfig?.scheme;
  if (Array.isArray(s)) return s[0] ?? 'smaran';
  return s ?? 'smaran';
}

export function buildInviteUrl(groupId: string, token: string): string {
  return `${scheme()}://join?g=${encodeURIComponent(groupId)}&t=${encodeURIComponent(token)}`;
}
