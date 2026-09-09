import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SkillList } from "../SkillList";
import { parseGitHubRepo } from "../services/github";
import type { Skill } from "../services/skills";

// Native port of the web `DiscoverTab` (`src/components/tabs/DiscoverTab.tsx`):
// search any GitHub repo for skills via the trees API, browse a curated
// popular list, install rows through `downloadSkill` (wired by the Sidebar's
// `onInstall`). Web `alert()` → RN `Alert.alert`; avatars → RN `Image`
// (`github.com/<owner>.png`, hidden on load error); StyleX cards → Uniwind
// rows. Deliberately out of scope: bookmarks dialog + per-item description
// prefetch (one fetch per row is too chatty for the MVP; rows show the path).

export interface PopularRepo {
  owner: string;
  repo: string;
  fullName: string;
  desc: string;
}

export const POPULAR_REPOS: PopularRepo[] = [
  { owner: "anthropics", repo: "skills", fullName: "anthropics/skills", desc: "Official Anthropic agent skills and guidelines." },
  { owner: "cursor", repo: "plugins", fullName: "cursor/plugins", desc: "Official Cursor community skills repository." },
  { owner: "vercel-labs", repo: "skills", fullName: "vercel-labs/skills", desc: "Foundational skills and examples from Vercel." },
  { owner: "cloudflare", repo: "skills", fullName: "cloudflare/skills", desc: "Skills for teaching agents to build on Cloudflare." },
  { owner: "expo", repo: "skills", fullName: "expo/skills", desc: "Official AI agent skills for Expo & React Native." },
  { owner: "mattpocock", repo: "skills", fullName: "mattpocock/skills", desc: "Skills for Real Engineers by Matt Pocock." },
  { owner: "addyosmani", repo: "agent-skills", fullName: "addyosmani/agent-skills", desc: "Production-grade engineering skills by Addy Osmani." },
  { owner: "garrytan", repo: "gstack", fullName: "garrytan/gstack", desc: "Garry Tan's Claude Code setup with 23+ skills & tools." },
];

export interface DiscoveredSkillItem {
  name: string;
  path: string;
  htmlUrl: string;
}

export interface DiscoverRepo {
  owner: string;
  repo: string;
  path?: string;
  branch: string;
}

interface TreeEntry {
  type: string;
  path: string;
}

// Pure mapping of a recursive GitHub trees response to installable rows:
// keeps SKILL.md-bearing dirs (plus cursor-rules files, web parity), scopes to
// the searched subpath when one was given, dedups by dir path. Pure so the
// discover flow stays unit-testable without the RN runtime or network.
export function mapTreeToSkillItems(
  tree: TreeEntry[],
  repo: DiscoverRepo,
): DiscoveredSkillItem[] {
  const seen = new Map<string, DiscoveredSkillItem>();
  for (const entry of tree) {
    if (entry.type !== "blob") continue;
    if (
      !entry.path.endsWith("SKILL.md") &&
      !entry.path.endsWith(".cursorrules") &&
      !entry.path.endsWith("cursorrules")
    ) {
      continue;
    }
    if (repo.path) {
      const scope = repo.path.replace(/\/+$/, "");
      if (entry.path !== scope && !entry.path.startsWith(`${scope}/`)) continue;
    }
    const parts = entry.path.split("/");
    parts.pop();
    const dirPath = parts.join("/");
    if (seen.has(dirPath)) continue;
    const name = parts.length > 0 ? parts[parts.length - 1] : repo.repo;
    seen.set(dirPath, {
      name,
      path: dirPath,
      htmlUrl: `https://github.com/${repo.owner}/${repo.repo}/tree/${repo.branch}${dirPath === "" ? "" : `/${dirPath}`}`,
    });
  }
  return [...seen.values()];
}

// Source string the installer consumes for a discovered row
// (`owner/repo[/path]` shorthand, same acceptance as `parseGitHubRepo`).
export function buildInstallSource(
  repo: { owner: string; repo: string },
  itemPath: string,
): string {
  return itemPath === "" ? `${repo.owner}/${repo.repo}` : `${repo.owner}/${repo.repo}/${itemPath}`;
}

export function DiscoverTab({
  installedSkills,
  onInstall,
}: {
  installedSkills: Skill[];
  onInstall: (source: string) => Promise<void>;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DiscoveredSkillItem[]>([]);
  const [repo, setRepo] = useState<DiscoverRepo | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const handleBrowse = async (raw: string): Promise<void> => {
    const trimmed = raw.trim();
    if (trimmed === "" || loading) return;
    const info = parseGitHubRepo(trimmed);
    if (!info) {
      setError("Invalid format. Use owner/repo or a GitHub URL.");
      return;
    }
    setLoading(true);
    setError(null);
    setItems([]);
    setRepo(null);
    setAvatarFailed(false);
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${info.owner}/${info.repo}`);
      if (!repoRes.ok) throw new Error("Repository not found");
      const repoData = (await repoRes.json()) as { default_branch?: unknown };
      const branch = typeof repoData.default_branch === "string" ? repoData.default_branch : "main";
      const treeRes = await fetch(
        `https://api.github.com/repos/${info.owner}/${info.repo}/git/trees/${branch}?recursive=1`,
      );
      if (!treeRes.ok) throw new Error("Failed to fetch repository tree");
      const treeData = (await treeRes.json()) as { tree?: unknown };
      const tree = Array.isArray(treeData.tree)
        ? (treeData.tree as { type?: unknown; path?: unknown }[])
            .filter(
              (e): e is { type: string; path: string } =>
                typeof e.type === "string" && typeof e.path === "string",
            )
        : [];
      const found: DiscoverRepo = { owner: info.owner, repo: info.repo, path: info.path, branch };
      const rows = mapTreeToSkillItems(tree, found);
      if (rows.length === 0) throw new Error("No skills found in this repository");
      setRepo(found);
      setItems(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch repository");
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = (item: DiscoveredSkillItem): void => {
    if (!repo || installing) return;
    const source = buildInstallSource(repo, item.path);
    setInstalling(item.path);
    void Promise.resolve()
      .then(() => onInstall(source))
      .then(() => {
        Alert.alert("Skill installed", `${item.name} was added to your skills.`);
      })
      .catch((err: unknown) => {
        Alert.alert("Install failed", err instanceof Error ? err.message : "Could not install skill.");
      })
      .finally(() => {
        setInstalling(null);
      });
  };

  const isInstalled = (item: DiscoveredSkillItem): boolean =>
    repo !== null &&
    installedSkills.some(
      (s) =>
        (s.packageName === `${repo.owner}/${repo.repo}` || s.packageName === repo.owner) &&
        s.slug === item.name,
    );

  return (
    <View className="flex-1 bg-surface-muted">
      <View className="gap-2 px-4 pb-2 pt-3">
        <Text className="text-[14px] font-bold text-foreground">Discover Skills</Text>
        <Text className="text-[12px] text-muted">
          Browse and install skills from any GitHub repository.
        </Text>
        <View className="flex-row gap-2 pt-1">
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
            onChangeText={(t) => {
              setQuery(t);
              setError(null);
            }}
            onSubmitEditing={() => void handleBrowse(query)}
            placeholder="anthropics/skills or GitHub URL"
            returnKeyType="search"
            value={query}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: loading || query.trim() === "" }}
            className={loading || query.trim() === ""
              ? "rounded-md bg-border px-3 py-1.5"
              : "rounded-md bg-primary px-3 py-1.5"}
            disabled={loading || query.trim() === ""}
            onPress={() => void handleBrowse(query)}
          >
            <Text className="text-[13px] font-semibold text-white">
              {loading ? "Browsing…" : "Browse"}
            </Text>
          </Pressable>
        </View>
        {error ? <Text className="text-[12px] text-danger">{error}</Text> : null}
      </View>

      {repo ? (
        <View className="flex-1">
          <View className="flex-row items-center gap-2 px-4 pb-2">
            {avatarFailed ? null : (
              <Image
                accessibilityLabel={`${repo.owner} avatar`}
                className="h-5 w-5 rounded"
                onError={() => setAvatarFailed(true)}
                source={{ uri: `https://github.com/${repo.owner}.png?size=64` }}
              />
            )}
            <Text className="flex-1 text-[12px] font-semibold text-foreground" numberOfLines={1}>
              {`${repo.owner} / ${repo.repo}${repo.path ? ` / ${repo.path}` : ""}`}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setRepo(null);
                setItems([]);
                setQuery("");
                setError(null);
              }}
            >
              <Text className="text-[12px] text-primary">← Back</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1">
            <View className="gap-2 px-2 pb-4">
              {items.map((item) => {
                const installed = isInstalled(item);
                const busy = installing === item.path;
                return (
                  <View
                    className="flex-row items-center rounded-lg border border-border bg-background px-3 py-2"
                    key={item.path === "" ? item.name : item.path}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="pt-0.5 text-[11px] text-muted" numberOfLines={1}>
                        {item.path === "" ? `${repo.owner}/${repo.repo}` : item.path}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: installed || busy }}
                      className={installed || busy
                        ? "rounded-md bg-border px-3 py-1.5"
                        : "rounded-md bg-primary px-3 py-1.5"}
                      disabled={installed || busy}
                      onPress={() => handleInstall(item)}
                    >
                      <Text className="text-[12px] font-semibold text-white">
                        {busy ? "Installing…" : installed ? "Installed" : "Install"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View className="flex-1">
          <View className="px-4 pb-1 pt-1">
            <Text className="text-[11px] font-semibold uppercase text-muted">
              Popular Repositories
            </Text>
          </View>
          <SkillList
            onSelect={(id) => void handleBrowse(id)}
            skills={POPULAR_REPOS.map((r) => ({ id: r.fullName, name: r.fullName }))}
          />
          <View className="px-4 pb-3">
            <Text className="text-[11px] text-muted" numberOfLines={2}>
              Tap a repo to list its skills, or paste any owner/repo above.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
