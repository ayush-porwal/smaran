# Smaran — Design Spec (Phase 0)

This document locks the visual and interaction language for the app. Every
component, screen, and motion decision in later phases references this file.
Change anything here and the rest of the app follows.

**UI foundation:** [Tamagui](https://tamagui.dev) for tokens, theming, and
the bulk of primitives. Custom Reanimated 3 components for app-specific
motion patterns and composite components Tamagui does not provide.

## 1. Product context

- **Name:** Smaran (placeholder, change freely)
- **Form factor:** Mobile (iOS + Android via React Native + Expo)
- **Primary surface:** Lists shared inside small groups (3-12 people)
- **Visual reference points:** Linear, Vercel, Things 3, Arc Browser
- **Tone:** Calm, focused, confident. The app should feel like a tool, not a toy.

## 2. Core principles

1. **Restraint over decoration.** One accent color. One type family. No gradients on chrome.
2. **Content is the hero.** Lists, items, and member names are visually loudest; navigation recedes.
3. **Motion is communication, not ornament.** Every animation teaches the user something changed.
4. **Dark is a first-class citizen.** Dark mode is not inverted light, it is designed.
5. **Speed feels like quality.** Perceived latency matters more than absolute latency. Skeletons and optimistic UI everywhere.

## 3. Color system

### 3.1 Accent: Indigo

We use a single saturated accent (`indigo.500`) for primary actions, active
states, links, and brand moments. Neutrals carry 95% of the UI.

| Token        | Light   | Dark    | Use                              |
| ------------ | ------- | ------- | -------------------------------- |
| `indigo.50`  | `#EEF0FF` | `#1A1B3A` | Subtle backgrounds, hover states |
| `indigo.100` | `#DCE0FF` | `#252754` | Tinted surfaces                  |
| `indigo.200` | `#B8C0FF` | `#3A3D7A` | Pressed surfaces                 |
| `indigo.300` | `#8E99FF` | `#5256A8` | Disabled accent                  |
| `indigo.400` | `#6B72F4` | `#6B72F4` | Hover over primary               |
| `indigo.500` | `#5B5FE9` | `#7C7FFF` | **Primary accent**               |
| `indigo.600` | `#4845C7` | `#9A9DFF` | Pressed primary                  |
| `indigo.700` | `#36339E` | `#B8BBFF` | High-contrast text on accent     |
| `indigo.800` | `#252574` | `#D4D6FF` | -                                |
| `indigo.900` | `#15164A` | `#E8EAFF` | -                                |

### 3.2 Neutrals

Pure neutral, no warm/cool tint. Numbers picked for AA contrast on background.

**Light:**

| Token             | Value     | Use                              |
| ----------------- | --------- | -------------------------------- |
| `bg.canvas`       | `#FAFAFA` | App background                   |
| `bg.surface`      | `#FFFFFF` | Cards, sheets, inputs            |
| `bg.subtle`       | `#F4F4F5` | Muted surface, hover             |
| `bg.muted`        | `#E4E4E7` | Dividers, disabled bg            |
| `border.default`  | `#E4E4E7` | Hairline borders                 |
| `border.strong`   | `#D4D4D8` | Visible borders, focused inputs  |
| `text.primary`    | `#0A0A0A` | Headings, primary content        |
| `text.secondary`  | `#52525B` | Body, descriptions               |
| `text.tertiary`   | `#A1A1AA` | Captions, placeholders           |
| `text.inverse`    | `#FAFAFA` | Text on accent fill              |

**Dark:**

| Token             | Value     | Use                              |
| ----------------- | --------- | -------------------------------- |
| `bg.canvas`       | `#0A0A0A` | App background                   |
| `bg.surface`      | `#131316` | Cards, sheets, inputs            |
| `bg.subtle`       | `#1C1C20` | Muted surface, hover             |
| `bg.muted`        | `#27272A` | Dividers, disabled bg            |
| `border.default`  | `#27272A` | Hairline borders                 |
| `border.strong`   | `#3F3F46` | Visible borders, focused inputs  |
| `text.primary`    | `#FAFAFA` | Headings, primary content        |
| `text.secondary`  | `#A1A1AA` | Body, descriptions               |
| `text.tertiary`   | `#71717A` | Captions, placeholders           |
| `text.inverse`    | `#0A0A0A` | Text on accent fill              |

### 3.3 Semantic

Use sparingly. These signal state, not decoration.

| Token      | Light   | Dark    | Use                              |
| ---------- | ------- | ------- | -------------------------------- |
| `success`  | `#16A34A` | `#22C55E` | Confirmed, completed, online   |
| `warning`  | `#D97706` | `#F59E0B` | Pending, attention needed       |
| `danger`   | `#DC2626` | `#EF4444` | Errors, destructive            |
| `info`     | `#0284C7` | `#38BDF8` | Informational neutral state     |

## 4. Typography

### 4.1 Family

**Inter Variable** as the single typeface. Geometric, neutral, ships with
excellent hinting at small sizes, and has a variable font file that covers
all weights in ~200KB. Fallback: `System` on each platform.

Loaded once at app boot via `expo-font`. Subset to Latin for now; extend
when localization is added.

### 4.2 Scale

Major-second ratio (1.125), tuned for mobile. Display sizes use tighter
tracking; body sizes use looser.

| Token         | Size | Line height | Weight | Letter spacing | Use                          |
| ------------- | ---- | ----------- | ------ | -------------- | ---------------------------- |
| `display.lg`  | 40   | 44          | 700    | -1.5%          | Hero, empty states           |
| `display.md`  | 32   | 38          | 700    | -1%            | Page titles                  |
| `heading.lg`  | 24   | 30          | 600    | -0.5%          | Section titles               |
| `heading.md`  | 20   | 26          | 600    | -0.25%         | Card titles                  |
| `heading.sm`  | 17   | 22          | 600    | 0              | List item titles             |
| `body.lg`     | 17   | 26          | 400    | 0              | Primary body                 |
| `body.md`     | 15   | 22          | 400    | 0              | Secondary body               |
| `body.sm`     | 13   | 18          | 400    | 0.1%           | Captions, metadata           |
| `label.md`    | 13   | 16          | 500    | 0.5%           | Button labels, tabs          |
| `label.sm`    | 11   | 14          | 500    | 1%             | Badges, chips (uppercase)    |
| `mono.md`     | 14   | 20          | 500    | 0              | Invite codes, IDs (Inter mono) |

### 4.3 Numerals

Use `tnum` (tabular numerals) for all lists, counts, and timestamps so
digit width doesn't jitter as values change.

## 5. Spacing

4px base. Numeric tokens. Avoid magic numbers in components.

| Token | px |
| ----- | -- |
| `0`   | 0  |
| `1`   | 4  |
| `2`   | 8  |
| `3`   | 12 |
| `4`   | 16 |
| `5`   | 20 |
| `6`   | 24 |
| `8`   | 32 |
| `10`  | 40 |
| `12`  | 48 |
| `16`  | 64 |
| `20`  | 80 |
| `24`  | 96 |

Layout rhythm: 16px screen padding, 12px between related items, 24px
between sections.

## 6. Radii

| Token | px  | Use                                |
| ----- | --- | ---------------------------------- |
| `sm`  | 6   | Inputs, checkboxes, small chips    |
| `md`  | 10  | Buttons, list items                |
| `lg`  | 14  | Cards                              |
| `xl`  | 20  | Sheets, large modals               |
| `2xl` | 28  | Hero cards, onboarding             |
| `full`| 9999| Avatars, pills, circular buttons   |

## 7. Elevation

Minimal. We rely more on borders than shadows for definition.

| Token | Light                                           | Dark                          |
| ----- | ----------------------------------------------- | ----------------------------- |
| `0`   | none                                            | none                          |
| `1`   | `0 1px 0 0 border.default` (1px hairline only)  | `0 0 0 1px border.default`    |
| `2`   | `0 1px 2px rgba(0,0,0,0.04), 0 1px 0 border.default` | `0 0 0 1px border.strong` |
| `3`   | `0 4px 12px rgba(0,0,0,0.08), 0 1px 0 border.default` | `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px border.default` |
| `4`   | `0 12px 32px rgba(0,0,0,0.12)` (modals only)    | `0 16px 48px rgba(0,0,0,0.5)` |

Rule: in dark mode, no shadows below `3`. Use border + slight surface lift.

## 8. Motion

All motion via Reanimated 3. No `Animated` API, no third-party tween libs.

### 8.1 Spring presets

```ts
export const springs = {
  // Default. Page transitions, fades, list mutations.
  standard: { damping: 20, stiffness: 200, mass: 1 },
  // Snappy. Press feedback, toggle on/off.
  snappy:   { damping: 18, stiffness: 320, mass: 0.8 },
  // Gentle. Modal/sheet entry.
  gentle:   { damping: 26, stiffness: 160, mass: 1.2 },
  // Bouncy. Success confirmations, check-off.
  bouncy:   { damping: 12, stiffness: 180, mass: 0.9 },
  // Stiff. Drag release, snap-to-grid.
  stiff:    { damping: 28, stiffness: 400, mass: 1 },
};
```

### 8.2 Timing presets

```ts
export const timings = {
  micro:   120,  // hover, press
  short:   200,  // fades, small transitions
  medium:  320,  // modals, sheets
  long:    480,  // page transitions, list staggers
};

export const easings = {
  standard:   [0.2, 0, 0, 1],     // decelerate
  accelerate: [0.3, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
};
```

### 8.3 Patterns

- **Press feedback:** `withSpring(scale, springs.snappy)` from 1.0 to 0.97 and back on release.
- **List entry:** items fade in with `opacity 0 -> 1` and `translateY 8 -> 0`, 30ms stagger between items.
- **List mutation (add):** new item scales from 0.95 to 1 with springs.standard, height auto-animates via `LayoutAnimation`.
- **List mutation (remove):** fade out (160ms) then collapse height (springs.standard).
- **Check-off:** strike-through animates `textDecorationLine` width from 0% to 100% over 240ms, item fades to `text.tertiary` over 200ms after.
- **Page transition:** shared element transition for hero (group avatar to header), fade for content with 60ms delay.
- **Sheet entry:** translateY 100% -> 0 with springs.gentle, backdrop fades in over 200ms.
- **Reduced motion:** all of the above replaced with 80ms opacity fades. Spring-based transforms disabled.

## 9. Iconography

**Phosphor** via `phosphor-react-native`. Default weight: `regular`. Size
24 by default, 20 in dense rows, 16 inline, 32 in empty states.

Use `bold` only for active tab icons and primary CTAs. Avoid mixing weights
in the same row.

Icons we will need from day one: house, list-checks, plus, check, x,
caret-right, caret-down, chevron-left, magnifier, gear, sign-out, envelope,
lock, eye, eye-slash, share, user-plus, users, bell, sparkle, trash, pencil,
arrow-up-right, arrow-down.

## 10. Tamagui foundation

We use Tamagui as the styling and primitive layer. It gives us typed
tokens, theming, and a large set of components out of the box. We wrap
its primitives in our own semantic API and build composite components
on top.

### 10.1 What Tamagui provides directly

These ship from Tamagui and we use them as-is (themed to match this
spec, not rebuilt):

- **Layout:** `XStack`, `YStack`, `ZStack` (our `Stack` is a thin re-export with semantic defaults)
- **Inputs:** `Button`, `Input`, `TextArea`, `Checkbox`, `Switch`, `Label`
- **Surfaces:** `Card`, `Sheet`, `Dialog` (Tamagui's modal), `Separator`
- **Feedback:** `Spinner`, `Skeleton`
- **Identity:** `Avatar`
- **Text:** `SizableText`, `Paragraph`, `Heading` (we wrap into our `Text` with the variant scale from section 4)

### 10.2 What we build on top

These are not in Tamagui, or our spec demands custom behavior that
Tamagui's defaults do not cover:

- **Layout:** `Screen` (safe area + status bar + keyboard handling wrapper), `Box` (view with our token-only style API)
- **Text:** `Text` (semantic variant prop mapping to our type scale)
- **Inputs:** `Pressable` (with built-in press-scale Reanimated animation)
- **Surfaces:** `Modal` (our API over Tamagui's `Dialog` with the spec's motion timings)
- **Lists:** `List` (FlashList wrapper with theme-aware separators), `ListItem` (leading/trailing slots, swipe actions)
- **Feedback:** `Toast`, `EmptyState` (icon + title + description + CTA), `ErrorState`
- **Identity:** `AvatarStack` (overlapping, max 4 then +N)
- **Motion:** `FadeIn`, `Stagger`, `PressableScale`, `Checkable` (animated check-off with strike-through)
- **Theme bridge:** `ThemeProvider`, `useTheme`, `useResolvedScheme` (system-follow + manual override)

### 10.3 Locked Tamagui decisions

- **Animation driver:** `@tamagui/animations-reanimated`. Lets simple
  Tamagui `animation` props share the Reanimated thread with our custom
  motion components. CSS driver is not used.
- **Bundle strategy:** start with all components compiled; revisit `dynamic`
  loading only if startup time suffers.
- **`media` queries:** declare a `xs/sm/md/lg` breakpoint set (320/640/768/1024)
  for tablet layouts later. Mobile-first; phone is the only target in
  Phase 0.
- **Font loading:** Tamagui's `FontLoader` with the Inter Variable file
  (regular, medium, semibold, bold). Loaded once at app boot.
- **`tamagui.config.ts` location:** `src/design-system/tamagui.config.ts`
  (committed). `babel.config.js` references it for the Tamagui babel plugin.
- **Reanimated babel plugin:** kept enabled. Tamagui's transform does not
  conflict; both run.
- **Re-exports:** `src/design-system/index.ts` re-exports Tamagui's
  primitives that we use as-is alongside our custom components, so feature
  code imports everything from one path.

## 11. Component inventory (Phase 0 deliverable)

The combined inventory of Tamagui primitives plus our custom components.
Each ships in both modes and is fully typed.

**Provided by Tamagui (themed, not rebuilt):**

- **Layout:** `XStack`, `YStack`, `ZStack`, `Separator`
- **Text:** `SizableText`, `Paragraph`, `Heading` (wrapped by our `Text`)
- **Inputs:** `Button`, `Input`, `TextArea`, `Checkbox`, `Switch`, `Label`
- **Surfaces:** `Card`, `Sheet`, `Dialog`
- **Feedback:** `Spinner`, `Skeleton`
- **Identity:** `Avatar`

**Built by us:**

- **Layout:** `Box`, `Stack` (semantic re-export), `Screen` (safe area + status bar + keyboard), `Divider`
- **Text:** `Text` (variant prop, our type scale), `Heading` (semantic levels)
- **Inputs:** `Pressable` (with press-scale Reanimated animation)
- **Surfaces:** `Modal` (our API over `Dialog`)
- **Lists:** `List` (FlashList wrapper), `ListItem` (with swipe actions)
- **Feedback:** `Toast`, `EmptyState`, `ErrorState`
- **Identity:** `AvatarStack` (overlapping, max 4 then +N)
- **Motion:** `FadeIn`, `Stagger`, `PressableScale`, `Checkable`
- **Theme:** `ThemeProvider`, `useTheme`, `useResolvedScheme`

## 12. Accessibility

- **Contrast:** 4.5:1 body, 3:1 large text, 3:1 UI components. Verified against `bg.canvas` and `bg.surface` in both modes.
- **Touch targets:** minimum 44x44 for all interactive elements. Buttons sized at sm=36 (compact lists only), md=44, lg=52.
- **Dynamic type:** body sizes scale up to 130% on iOS, 200% on Android, layout reflows gracefully.
- **Reduced motion:** all spring animations fall back to fades. Provided via `useReducedMotion()` from `react-native-reanimated`.
- **Screen reader:** every interactive element has an `accessibilityLabel`. Decorative icons have `accessibilityElementsHidden` / `importantForAccessibility="no"`.
- **Focus order:** follows visual order, no tabindex tricks.

## 12. Implementation layout

```
src/
  design-system/
    tokens/
      colors.ts        # indigo + neutral + semantic, light/dark
      typography.ts    # type scale, weights, tracking
      spacing.ts       # 4px scale
      radii.ts
      elevation.ts     # shadow strings
      motion.ts        # springs, timings, easings
    primitives/
      Box.tsx Stack.tsx Screen.tsx Text.tsx Heading.tsx
      Button.tsx Input.tsx TextArea.tsx Checkbox.tsx Switch.tsx
      Card.tsx Sheet.tsx Modal.tsx
      List.tsx ListItem.tsx
      Skeleton.tsx Spinner.tsx Toast.tsx
      EmptyState.tsx ErrorState.tsx
      Avatar.tsx AvatarStack.tsx
      motion.tsx       # FadeIn, Stagger, PressableScale, Checkable
    index.ts           # public exports
    theme/
      ThemeProvider.tsx
      useTheme.ts
      useReducedMotion.ts
      types.ts
  app/                 # Expo Router routes
  features/
  lib/
  amplify/
```

Tokens are typed constants. The `ThemeProvider` resolves the active scheme
(system or override) and exposes a `useTheme()` hook returning the
semantic token map. Components consume tokens through this hook, never
through raw `StyleSheet` literals.

## 13. What is NOT in scope for the design system

To keep Phase 0 focused, we will not build yet: date pickers, rich text
editor, image picker/cropper, charts, map view, skeleton for complex
shapes, custom illustrations. We will use platform defaults for these
with custom theming where possible, and revisit in later phases.
