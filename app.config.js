export default {
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      src: "src/app"
    }
  },
  expo: {
    name: "ai-expense-manager",
    slug: "ai-expense-manager",
  plugins: ["expo-web-browser", "expo-dev-client"],
    android: {
      package: "com.anonymous.aiexpensemanager",
    },
    ios: {
      bundleIdentifier: "com.anonymous.aiexpensemanager"
    },
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/home.png",
    runtimeVersion: "1.0.0",
    updates: {
      enabled: false
      },
    assetBundlePatterns: ["**/*"],
    extra: {
      eas: {
        projectId: "5ee44fc4-05a4-4c48-b813-b3c70bedc2bf",
      },
    },
  }
}
