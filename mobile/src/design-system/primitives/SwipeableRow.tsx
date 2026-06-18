// SwipeableRow: a row that reveals an action when the user swipes
// horizontally. Built on `react-native-gesture-handler`'s `Swipeable`.
// The row stays in the normal flex flow; the action renders behind it
// and animates in as the user drags.
//
// Two gesture directions, named after the motion the user makes:
//   - `onRightSwipe`: content drags rightward, action slides in from
//     the left edge. Use for "mark done" on unchecked items.
//   - `onLeftSwipe`: content drags leftward, action slides in from
//     the right edge. Use for "undo" on checked items, or "delete".
import { type ReactNode, useRef } from 'react';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { View, XStack } from 'tamagui';
import { Check, ArrowCounterClockwise } from 'phosphor-react-native';

import { Icon } from './Icon';
import { Text } from './Text';

type ActionTone = 'accent' | 'muted' | 'danger';

type SwipeAction = {
  label: string;
  tone: ActionTone;
  onAction: () => void;
};

const TONE_BG: Record<ActionTone, string> = {
  accent: '$accent',
  muted: '$bgMuted',
  danger: '$danger',
};

type SwipeableRowProps = {
  children: ReactNode;
  // Action revealed when the user swipes the row to the RIGHT
  // (content moves rightward, action slides in from the left edge).
  // Use for "mark done" on unchecked items.
  onRightSwipe?: SwipeAction;
  // Action revealed when the user swipes the row to the LEFT
  // (content moves leftward, action slides in from the right edge).
  // Use for "undo" on checked items, or "delete".
  onLeftSwipe?: SwipeAction;
};

function ActionPanel({
  alignEnd,
  action,
}: {
  // true = action sits on the right edge of the screen (revealed
  // by a left swipe); false = sits on the left edge (revealed by
  // a right swipe).
  alignEnd: boolean;
  action: SwipeAction;
}) {
  const isDone = action.label.toLowerCase().includes('done');
  const isUndo = action.label.toLowerCase().includes('undo');
  const IconCmp = isDone ? Check : isUndo ? ArrowCounterClockwise : null;
  const fg =
    action.tone === 'accent'
      ? '#FFFFFF'
      : action.tone === 'danger'
        ? '#FFFFFF'
        : undefined;

  return (
    <View
      flex={1}
      flexDirection={alignEnd ? 'row' : 'row-reverse'}
      backgroundColor={TONE_BG[action.tone]}
      alignItems="center"
      paddingHorizontal="$4"
    >
      <XStack alignItems="center" gap="$2">
        {IconCmp ? (
          <Icon
            icon={IconCmp}
            tone={
              action.tone === 'accent'
                ? 'onAccent'
                : action.tone === 'danger'
                  ? 'onDanger'
                  : 'textPrimary'
            }
            size={18}
            weight="bold"
          />
        ) : null}
        <Text
          variant="label.md"
          color={fg as 'onAccent' | 'onDanger' | 'textPrimary' | undefined}
        >
          {action.label}
        </Text>
      </XStack>
    </View>
  );
}

export function SwipeableRow({
  children,
  onRightSwipe,
  onLeftSwipe,
}: SwipeableRowProps) {
  const ref = useRef<Swipeable | null>(null);
  // `Swipeable` is counter-intuitive:
  //   - `renderLeftActions` = action revealed by a RIGHT swipe
  //     (content drags rightward, revealing what's on the left).
  //   - `renderRightActions` = action revealed by a LEFT swipe
  //     (content drags leftward, revealing what's on the right).
  const renderLeftActions = () =>
    onRightSwipe ? <ActionPanel alignEnd={false} action={onRightSwipe} /> : null;
  const renderRightActions = () =>
    onLeftSwipe ? <ActionPanel alignEnd={true} action={onLeftSwipe} /> : null;

  return (
    <Swipeable
      ref={(s) => {
        ref.current = s;
      }}
      friction={1.5}
      leftThreshold={60}
      rightThreshold={60}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        // 'right' = user swiped content rightward → onRightSwipe.
        // 'left' = user swiped content leftward → onLeftSwipe.
        const action =
          direction === 'right' ? onRightSwipe : direction === 'left' ? onLeftSwipe : undefined;
        if (action) action.onAction();
        ref.current?.close();
      }}
    >
      <RectButton
        enabled={false}
        style={{ backgroundColor: 'transparent' }}
      >
        {children}
      </RectButton>
    </Swipeable>
  );
}
