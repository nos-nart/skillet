import type { AppManifest } from "../../scripts/lib/types";

const manifest = {
  id: "skillet",
  displayName: "Skillet",
  platforms: ["macos"],
  bundleIds: {
    ios: "so.skillet.ios",
    macos: "so.skillet.macos",
  },
  androidPackage: "so.skillet",
  expoModules: {
    macos: false,
  },
  hostWindow: {
    macos: {
      startupBackgroundColors: { dark: "#191A1B", light: "#f5f6f8" },
    },
  },
  nativeModules: {
    macos: [
      "@skillet/skills-fs",
      "@legend-apps/storage",
      "@legend-apps/file-dialog",
      "@legend-apps/file-scanner",
      "@legend-apps/window-manager",
      "@legend-apps/windows",
      "@legend-apps/native-menu",
      "@legend-apps/appkit-split-view",
      "react-native-enriched-markdown",
    ],
    ios: [],
    android: [],
  },
} satisfies AppManifest;

export default manifest;
