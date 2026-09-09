import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SkillList } from "../SkillList";
import {
  browseRepoForSkills,
  buildInstallSource,
  parseGitHubRepo,
  POPULAR_REPOS,
  type DiscoveredSkillItem,
  type FetchFn,
  type GitHubRepoInfo,
} from "../services/github";
import type { Skill } from "../services/skills";

// Native port of the web `DiscoverTab` (`src/components/tabs/DiscoverTab.tsx`):
// search any GitHub repo for skills via the trees API, browse a curated
// popular list, install rows through `downloadSkill` (wired by the Sidebar's
// `onInstall`). Web `alert()` → RN `Alert.alert`; avatars → RN `Image`
// (`github.com/<owner>.png`, hidden on load error); StyleX cards → Uniwind
// rows. Deliberately out of scope: bookmarks dialog + per-item description
// prefetch (one fetch per row is too chatty for the MVP; rows show the path).
// Repo search itself lives in `services/github.ts` (`browseRepoForSkills` +
// `mapTreeToSkillItems` + `POPULAR_REPOS`); this file keeps the component and
// selection state.

export function DiscoverTab({
  installedSkills,
  onInstall,
  token,
  fetchImpl,
}: {
  installedSkills: Skill[];
  onInstall: (source: string) => Promise<void>;
  token?: string;
  fetchImpl?: FetchFn;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DiscoveredSkillItem[]>([]);
  const [repo, setRepo] = useState<GitHubRepoInfo | null>(null);
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
      const found = await browseRepoForSkills(info, { token, fetchImpl });
      setRepo(found.repo);
      setItems(found.items);
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
