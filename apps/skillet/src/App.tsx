import { SidebarSplitView } from "@legend-apps/appkit-split-view";
import { WindowProvider } from "@legend-apps/windows";
import { useState } from "react";
import { Text, View } from "react-native";
import { Sidebar } from "./Sidebar";

// Single main window (global constraint: no multi-window at MVP). The
// detail pane is a placeholder showing the Task 5 selection — Task 6
// replaces it with SkillDetail + toggles.
export function App(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  return (
    <WindowProvider id="main">
      <SidebarSplitView contentMinWidth={320} sidebarMinWidth={220} sidebarWidth={280}>
        <Sidebar onSelect={setSelectedId} selectedId={selectedId} />
        <View className="flex-1 items-center justify-center bg-background px-10">
          <Text className="text-center text-sm text-muted">
            {selectedId ?? "Select a skill"}
          </Text>
        </View>
      </SidebarSplitView>
    </WindowProvider>
  );
}
