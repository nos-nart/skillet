import "react-native";

declare module "react-native" {
  interface TextInputProps {
    enableFocusRing?: boolean;
    focusRingType?: "none" | "default" | string;
  }
}
