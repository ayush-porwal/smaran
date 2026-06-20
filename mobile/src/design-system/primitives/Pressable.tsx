// PressableScale keeps press feedback (springs.snappy, 0.97) in one place.
import { Pressable as RNPressable } from "react-native";
import type { PressableProps as RNPressableProps } from "react-native";
import type { ReactNode } from "react";

import { PressableScale } from "./motion";

export type PressableProps = Omit<RNPressableProps, "children"> & {
  children: ReactNode | ((state: { pressed: boolean }) => ReactNode);
};

export function Pressable({ children, style, ...props }: PressableProps) {
  return (
    <RNPressable style={style} {...props}>
      {({ pressed }) => (
        <PressableScale
          pressedScale={pressed ? 0.97 : 1}
          style={{ flexGrow: 1 }}
        >
          <>
            {typeof children === "function" ? children({ pressed }) : children}
          </>
        </PressableScale>
      )}
    </RNPressable>
  );
}
