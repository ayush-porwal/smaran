import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$3">
        <Text fontSize="$8" fontWeight="700" color="$color">
          Smaran
        </Text>
        <Text fontSize="$4" color="$color" opacity={0.6}>
          Phase 0 boot check
        </Text>
      </YStack>
    </SafeAreaView>
  );
}
