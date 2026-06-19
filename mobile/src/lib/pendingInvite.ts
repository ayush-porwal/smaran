// Carries a tapped invite link across the sign-in detour. When someone
// opens an invite link while signed out, `app/join.tsx` stashes the
// {groupId, token} here and sends them to sign-in; the sign-in screen
// reads it back on success and resumes the join. This is what makes the
// "opened the link before logging in" path gap-free.
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
