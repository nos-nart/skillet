import { scanSkillsDir } from "@skillet/skills-fs";
import { SFSymbol } from "@legend-apps/sf-symbol";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "../AppText";

// Port of the old AgentsTab (`src/components/tabs/AgentsTab.tsx`): agent cards
// with install locations. Status is live — a dir that scans cleanly counts as
// Active, otherwise Ready (old `api.getAgents()` parity).
interface AgentCard {
  id: string;
  name: string;
  globalDir: string;
  color: string;
}

const AGENTS: AgentCard[] = [
  { id: "claude-code", name: "Claude Code", globalDirName: ".claude/skills", color: "#D97757" },
  { id: "cursor", name: "Cursor", globalDirName: ".cursor/skills", color: "" },
  { id: "gemini", name: "Gemini", globalDirName: ".gemini/config/skills", color: "#4285F4" },
  { id: "antigravity", name: "Antigravity", globalDirName: ".gemini/config/skills", color: "#4285F4" },
  { id: "generic", name: "Generic Open Skills", globalDirName: ".skills", color: "" },
  { id: "windsurf", name: "Windsurf", globalDirName: ".codeium/windsurf/skills", color: "#14b8a6" },
  { id: "copilot", name: "GitHub Copilot", globalDirName: ".github/skills", color: "" },
  { id: "opencode", name: "OpenCode", globalDirName: ".opencode/skills", color: "" },
].map((a) => ({ id: a.id, name: a.name, globalDir: `~/${a.globalDirName}`, color: a.color }));

async function probeActive(dir: string): Promise<boolean> {
  try {
    await scanSkillsDir(dir);
    return true;
  } catch {
    return false;
  }
}

export function AgentsTab(): React.JSX.Element {
  const [active, setActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        AGENTS.map(async (a): Promise<[string, boolean]> => [a.id, await probeActive(a.globalDir)]),
      );
      if (!cancelled) setActive(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="mx-auto w-full max-w-[780px] gap-6 px-9 py-8">
        <View>
          <View className="flex-row items-center gap-2">
            <SFSymbol name="cpu" size={20} />
            <Text className="text-[20px] font-bold text-foreground">Detected Coding Agents</Text>
          </View>
          <Text className="pt-1.5 text-[13px] leading-5 text-muted">
            Active AI coding agents and their standard skill discovery locations on your system.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3.5">
          {AGENTS.map((agent) => {
            const isActive = active[agent.id] ?? false;
            return (
              <View
                className="min-w-[220px] flex-1 gap-3 rounded-[10px] border border-border bg-surface-muted p-4"
                key={agent.id}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: agent.color !== "" ? agent.color : "#a3a3a3" }}
                    />
                    <Text className="min-w-0 flex-1 text-[13px] font-semibold text-foreground" numberOfLines={1}>
                      {agent.name}
                    </Text>
                  </View>
                  <View className={`rounded-md px-2 py-0.5 ${isActive ? "bg-emerald-500/15" : "bg-surface"}`}>
                    <Text className={`text-[11px] font-semibold ${isActive ? "text-emerald-500" : "text-muted"}`}>
                      {isActive ? "Active" : "Ready"}
                    </Text>
                  </View>
                </View>
                <Text className="text-[12px] text-muted" mono numberOfLines={1}>
                  {agent.globalDir}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
