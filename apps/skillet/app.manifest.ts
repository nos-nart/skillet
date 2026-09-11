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
      "@legend-apps/syntax-parser",
    ],
    ios: [],
    android: [],
  },
  // RELEASE CHECKLIST — READ BEFORE ANY SIGNED/NOTARIZED DISTRIBUTION:
  // 1. ROTATE `release.macos.sparkle.publicEdKey` (DEV-ONLY PLACEHOLDER below:
  //    generated locally for Task 7, private key discarded and never stored —
  //    nobody can publish valid appcasts for it, so updates fail closed).
  // 2. SET `signing.macos.developmentTeam` (currently absent → ad-hoc sign only).
  // 3. GREP for "DEV-ONLY PLACEHOLDER" and confirm zero hits before release.
  // `verify-app` does NOT fail on the placeholder (unsigned local packaging
  // requires a key in Info.plist as SUPublicEDKey); this checklist is the guard.
  // Chosen over a verify-time hard-fail so `bun run skillet verify macos` and
  // `--skip-sign` local packaging stay green without a real team/key.
  release: {
    macos: {
      sparkle: {
        publicEdKey: "eqeP/1QrZIHfyEkhUlVZXL+MSIea5bTxfY+vj7C+tms=",
      },
    },
  },
} satisfies AppManifest;

export default manifest;
