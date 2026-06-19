// Builds the shareable group-invite URL and parses it back. The link
// uses the app's custom scheme (`smaran://join?g=<groupId>&t=<token>`),
// which a development or standalone build registers, so opening it on a
// device that has the app routes to `app/join.tsx`.
//
// Note: this is a custom-scheme link — it opens the app when the app is
// installed. Making it a clickable https:// universal link (and handling
// the "no app yet" case) needs domain + store setup; see app/join.tsx.
import Constants from 'expo-constants';

function scheme(): string {
  const s = Constants.expoConfig?.scheme;
  if (Array.isArray(s)) return s[0] ?? 'smaran';
  return s ?? 'smaran';
}

export function buildInviteUrl(groupId: string, token: string): string {
  return `${scheme()}://join?g=${encodeURIComponent(groupId)}&t=${encodeURIComponent(token)}`;
}
