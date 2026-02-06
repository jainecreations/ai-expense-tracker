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
    name: "Expense Tracker",
    slug: "ai-expense-manager",
    scheme: "ai-expense-manager",
    plugins: ["expo-web-browser", "expo-dev-client"],
    android: {
      package: "com.anonymous.aiexpensemanager",
      adaptiveIcon: {
        foregroundImage: "./src/assets/app-logo-full.png",
        backgroundColor: "#2874F0"
      }
    },
    ios: {
      bundleIdentifier: "com.anonymous.aiexpensemanager"
    },
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/app-logo-full.png",
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
    splash: {
      "image": "./src/assets/home.png"
    }
  }
}
