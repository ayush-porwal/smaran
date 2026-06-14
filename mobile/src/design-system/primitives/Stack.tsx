// Semantic re-exports of Tamagui's XStack/YStack/ZStack. We give them
// our names so feature code imports from a single path. Defaults baked
// in: gap follows the spec's 12px item rhythm; flex 1 is opt-in via prop
// because not every stack should fill its parent.
import { XStack, YStack, ZStack } from 'tamagui';

export const Stack = {
  Horizontal: XStack,
  Vertical: YStack,
  Layered: ZStack,
};

// Convenience aliases for the common directions.
export const HStack = XStack;
export const VStack = YStack;
