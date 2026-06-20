// Stashes invite {groupId, token} across sign-in so app/join.tsx can resume after auth.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'smaran.pendingInvite.v1';

export type PendingInvite = { groupId: string; token: string };

export async function savePendingInvite(value: PendingInvite): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}

// Read and clear in one step so a stale pending invite can't loop.
export async function takePendingInvite(): Promise<PendingInvite | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(KEY);
  try {
    const v = JSON.parse(raw) as PendingInvite;
    return v.groupId && v.token ? v : null;
  } catch {
    return null;
  }
}
