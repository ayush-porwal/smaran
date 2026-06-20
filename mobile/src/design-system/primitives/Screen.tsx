// Route wrapper: safe area, bgCanvas (avoids white flash on mount), optional keyboard avoidance.
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
