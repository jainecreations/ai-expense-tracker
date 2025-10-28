module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  plugins.push([
        "module-resolver",
        {
          "root": ["./src"],
          "alias": {
            "@": "./src"
          }
        }
      ]);
  plugins.push('react-native-reanimated/plugin');
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins
  };
};
