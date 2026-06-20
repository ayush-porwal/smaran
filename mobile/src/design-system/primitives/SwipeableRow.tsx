import { type ReactNode, useRef } from "react";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { View, XStack } from "tamagui";
import { ArrowCounterClockwiseIcon, CheckIcon } from "phosphor-react-native";

import { Icon } from "./Icon";
import { Text } from "./Text";

type ActionTone = "accent" | "muted" | "danger";

type SwipeAction = {
  label: string;
  tone: ActionTone;
  onAction: () => void;
};

const TONE_BG: Record<ActionTone, string> = {
  accent: "$accent",
  muted: "$bgMuted",
  danger: "$danger",
};

type SwipeableRowProps = {
  children: ReactNode;
  onRightSwipe?: SwipeAction;
  onLeftSwipe?: SwipeAction;
};

function ActionPanel({
  alignEnd,
  action,
}: {
  alignEnd: boolean;
  action: SwipeAction;
}) {
  const isDone = action.label.toLowerCase().includes("done");
  const isUndo = action.label.toLowerCase().includes("undo");
  const IconCmp = isDone
    ? CheckIcon
    : isUndo
      ? ArrowCounterClockwiseIcon
      : null;
  const labelColor =
    action.tone === "accent"
      ? "$onAccent"
      : action.tone === "danger"
        ? "$onDanger"
        : "$textPrimary";

  return (
    <View
      flex={1}
      flexDirection={alignEnd ? "row" : "row-reverse"}
      backgroundColor={TONE_BG[action.tone]}
      alignItems="center"
      paddingHorizontal="$4"
    >
      <XStack alignItems="center" gap="$2">
        {IconCmp ? (
          <Icon
            icon={IconCmp}
            tone={
              action.tone === "accent"
                ? "onAccent"
                : action.tone === "danger"
                  ? "onDanger"
                  : "textPrimary"
            }
            size={18}
            weight="bold"
          />
        ) : null}
        <Text variant="label.md" color={labelColor}>
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
  // Swipeable naming is inverted: renderLeftActions = revealed by a RIGHT swipe.
  const renderLeftActions = () =>
    onRightSwipe ? (
      <ActionPanel alignEnd={false} action={onRightSwipe} />
    ) : null;
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
        const action =
          direction === "right"
            ? onRightSwipe
            : direction === "left"
              ? onLeftSwipe
              : undefined;
        if (action) action.onAction();
        ref.current?.close();
      }}
    >
      <RectButton enabled={false} style={{ backgroundColor: "transparent" }}>
        {children}
      </RectButton>
    </Swipeable>
  );
}
