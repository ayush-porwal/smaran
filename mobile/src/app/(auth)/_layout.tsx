// Layout for the (auth) group. Auth screens share a centered, narrow
// column layout; the tab bar is not visible here. No state — auth
// screens are independent of each other and the group is just a
// navigation namespace.
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
