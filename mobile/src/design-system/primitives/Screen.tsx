// Screen is the wrapper for every top-level route. It handles three things:
//   1. Safe area (top + bottom edges only by default; pass `edges` to customize),
//   2. The `bgCanvas` background — without this, the page can flash the
//      default RN white between the route mount and the themed paint,
//   3. Keyboard avoidance via keyboard-controller's KeyboardAvoidingView
//      when `keyboardAvoid` is set. `automaticOffset` lets it detect its
//      own on-screen position, so it handles the tab bar / headers
//      without a manual `keyboardVerticalOffset`.
//
// Use it as the root element of every route's component. Don't put
// safe-area insets inside individual sections; one Screen per route.
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { YStack, styled } from 'tamagui';
import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

const Root = styled(YStack, {
  name: 'Screen',
  flex: 1,
  backgroundColor: '$bgCanvas',
});

type ScreenProps = {
  children: ReactNode;
  edges?: readonly Edge[];
  keyboardAvoid?: boolean;
  padded?: boolean;
};

export function Screen({
  children,
  edges = ['top', 'bottom'] as const,
  keyboardAvoid = false,
  padded = true,
}: ScreenProps) {
  const content = (
    <SafeAreaView
      edges={edges as Edge[]}
      style={{ flex: 1, paddingHorizontal: padded ? 16 : 0 }}
    >
      {children}
    </SafeAreaView>
  );
  return (
    <Root>
      {keyboardAvoid ? (
        <KeyboardAvoidingView behavior="padding" automaticOffset style={{ flex: 1 }}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Root>
  );
}
