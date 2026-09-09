import { View } from "react-native";

// Placeholder shell owned by Task 4 (tokens + app shell). Exists now so
// `bun run skillet verify macos` (which reads apps/skillet/src/App.tsx) and
// Metro's `@legend-apps/app` alias have a module to resolve.
export function App(): React.JSX.Element {
  return <View className="flex-1" />;
}
