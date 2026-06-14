// View wrapper that adds our design-system defaults (background = canvas,
// default padding rhythm). Use for ad-hoc layouts that don't need Stack's
// gap/justify conveniences. Most of the app should reach for Stack first.
import { styled, View } from 'tamagui';

export const Box = styled(View, {
  name: 'Box',
  backgroundColor: '$bgCanvas',
});
