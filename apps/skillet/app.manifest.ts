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
  // No `signing.macos.developmentTeam`: no Apple Developer team is available
  // for this MVP, so Release builds ad-hoc sign (`--skip-sign` packaging).
  // `release.macos.sparkle.publicEdKey` is REQUIRED by `package-macos-app.ts`
  // even for unsigned locals (it lands in Info.plist as SUPublicEDKey).
  // DEV-ONLY PLACEHOLDER: generated locally for Task 7, private key discarded
  // and never stored — MUST be replaced with the real release keypair before
  // any signed/notarized distribution (nobody can publish valid appcasts for
  // this key, so rotation is enforced, not just advised).
  release: {
    macos: {
      sparkle: {
        publicEdKey: "eqeP/1QrZIHfyEkhUlVZXL+MSIea5bTxfY+vj7C+tms=",
      },
    },
  },
} satisfies AppManifest;

export default manifest;
