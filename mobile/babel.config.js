// Do NOT set `jsxImportSource: 'tamagui'` — Tamagui v2 doesn't export jsx-runtime;
// that rewrite breaks Expo's log-box and metro runtime.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['@tamagui/babel-plugin'],
  };
};
