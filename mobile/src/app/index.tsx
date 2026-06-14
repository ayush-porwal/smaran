// Root index. The mock layer auto-signs in a user, so we just hand
// off to the (app) tab navigator. When real Cognito lands, this is
// where the auth gate lives: check the session, redirect to (auth) if
// missing, otherwise to (app).
import { Redirect } from 'expo-router';

import { useCurrentUser } from '@/lib/api/useCurrentUser';

export default function Index() {
  const { user, loading } = useCurrentUser();
  if (loading) return null;
  if (!user) return <Redirect href={'/(auth)/sign-in' as never} />;
  return <Redirect href={'/(app)' as never} />;
}
