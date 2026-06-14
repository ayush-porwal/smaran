// babel-preset-expo auto-wires the Reanimated 4 plugin when the
// package is present, so we only add what Expo doesn't: the Tamagui
// plugin for compile-time style extraction. We deliberately do NOT set
// `jsxImportSource: 'tamagui'` here — that option rewrites every JSX
// call site in the project (including Expo's own log-box and metro
// runtime) to import from `tamagui/jsx-runtime`, which Tamagui v2
// doesn't export. The styled() API works fine with the default
// react/jsx-runtime; only the babel-time optimizations change.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['@tamagui/babel-plugin'],
  };
};
