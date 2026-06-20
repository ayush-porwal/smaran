import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { XStack, YStack } from "tamagui";
import {
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
  XIcon,
} from "phosphor-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

export type ToastKind = "success" | "error" | "info";
export type Toast = { id: string; kind: ToastKind; message: string };

type ToastContextValue = {
  show: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { ...toast, id }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <YStack
        position="absolute"
        top={50}
        left={0}
        right={0}
        alignItems="center"
        pointerEvents="box-none"
        gap="$2"
      >
        {toasts.map((t) => (
          <Animated.View
            key={t.id}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(160)}
            style={{ width: "90%", maxWidth: 480 }}
          >
            <XStack
              backgroundColor="$bgSurface"
              borderColor="$borderDefault"
              borderWidth={1}
              borderRadius="$md"
              paddingHorizontal="$4"
              paddingVertical="$3"
              gap="$3"
              alignItems="center"
              shadowColor="#000"
              shadowOpacity={0.12}
              shadowRadius={12}
              shadowOffset={{ width: 0, height: 4 }}
              elevation={4}
            >
              {t.kind === "success" ? (
                <Icon
                  icon={CheckCircleIcon}
                  tone="success"
                  size={20}
                  weight="fill"
                />
              ) : null}
              {t.kind === "error" ? (
                <Icon
                  icon={WarningIcon}
                  tone="danger"
                  size={20}
                  weight="fill"
                />
              ) : null}
              {t.kind === "info" ? (
                <Icon icon={InfoIcon} tone="info" size={20} weight="fill" />
              ) : null}
              <Text variant="body.md" color="$textPrimary" flex={1}>
                {t.message}
              </Text>
              <Pressable onPress={() => dismiss(t.id)} hitSlop={8}>
                <Icon
                  icon={XIcon}
                  tone="textTertiary"
                  size={16}
                  weight="bold"
                />
              </Pressable>
            </XStack>
          </Animated.View>
        ))}
      </YStack>
    </ToastContext.Provider>
  );
}
