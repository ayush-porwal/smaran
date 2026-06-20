import { Avatar, XStack, Text } from 'tamagui';

type AvatarStackProps = {
  members: { id: string; name: string }[];
  max?: number;
  size?: number;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarStack({ members, max = 4, size = 24 }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <XStack>
      {visible.map((m, i) => (
        <Avatar
          key={m.id}
          size={size}
          circular
          backgroundColor="$bgSubtle"
          borderColor="$bgSurface"
          borderWidth={2}
          marginLeft={i === 0 ? 0 : -8}
        >
          <Text fontSize={size * 0.4} fontWeight="600" color="$textPrimary">
            {initialsOf(m.name)}
          </Text>
        </Avatar>
      ))}
      {overflow > 0 ? (
        <Avatar
          size={size}
          circular
          backgroundColor="$bgMuted"
          borderColor="$bgSurface"
          borderWidth={2}
          marginLeft={-8}
        >
          <Text fontSize={size * 0.4} fontWeight="600" color="$textSecondary">
            +{overflow}
          </Text>
        </Avatar>
      ) : null}
    </XStack>
  );
}
