// Toast: a minimal in-app toast. We don't pull in a toast library;
// the surface area is small enough that an imperative imperative
// store + a top-level renderer covers our needs.
//
// Usage:
//   const toast = useToast();
//   toast.show({ kind: 'success', message: 'Saved' });
//
// Phase 0 keeps it simple: one toast at a time, mounted in the root
// layout, no swipe-to-dismiss. Phase 4 may revisit if we need queues.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { CheckCircle, Warning, Info, X } from 'phosphor-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Pressable } from './Pressable';
import { Text } from './Text';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = { id: string; kind: ToastKind; message: string };

type ToastContextValue = {
  show: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { ...toast, id }]);
      // Auto-dismiss after 3.5s. Phase 4 may make this per-kind.
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
            style={{ width: '90%', maxWidth: 480 }}
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
              // Spec section 7: elevation 3 in light, hairline in dark.
              shadowColor="#000"
              shadowOpacity={0.12}
              shadowRadius={12}
              shadowOffset={{ width: 0, height: 4 }}
              elevation={4}
            >
              {t.kind === 'success' ? <CheckCircle size={20} color="$success" /> : null}
              {t.kind === 'error' ? <Warning size={20} color="$danger" /> : null}
              {t.kind === 'info' ? <Info size={20} color="$info" /> : null}
              <Text variant="body.md" color="$textPrimary" flex={1}>
                {t.message}
              </Text>
              <Pressable onPress={() => dismiss(t.id)} hitSlop={8}>
                <X size={16} color="$textTertiary" />
              </Pressable>
            </XStack>
          </Animated.View>
        ))}
      </YStack>
    </ToastContext.Provider>
  );
}
