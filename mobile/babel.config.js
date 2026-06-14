// babel-preset-expo auto-wires the Reanimated 4 plugin when the package is
// present, so we only add what Expo doesn't: the Tamagui plugin and the JSX
// import source that lets `<Button />` resolve to Tamagui's view.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'tamagui' }]],
    plugins: ['@tamagui/babel-plugin'],
  };
};
