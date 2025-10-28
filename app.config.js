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
    plugins: ["expo-web-browser"],
    android: {
      package: "com.anonymous.aiexpensemanager",
    },
    ios: {
      bundleIdentifier: "com.anonymous.aiexpensemanager"
    }
  }
}
