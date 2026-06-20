import { Redirect } from 'expo-router';

import { useCurrentUser } from '@/lib/api/useCurrentUser';

export default function Index() {
  const { user, loading } = useCurrentUser();
  if (loading) return null;
  if (!user) return <Redirect href={'/(auth)/sign-in' as never} />;
  return <Redirect href={'/(app)' as never} />;
}
