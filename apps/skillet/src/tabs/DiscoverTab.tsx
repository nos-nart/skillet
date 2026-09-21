import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { Text } from "../AppText";
import { SFSymbol } from "@legend-apps/sf-symbol";
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
import { useThemePalette } from "../services/theme";

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
  const c = useThemePalette();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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
      setError(err instanceof Error ? err.message : "Failed to load skills from repository.");
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
      .catch((cause: unknown) => {
        Alert.alert("Install failed", cause instanceof Error ? cause.message : "Could not install skill.");
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
    <View className="flex-1 bg-background">
      <View className="gap-2 px-4 pb-3 pt-3">
        <Text className="text-[14px] font-bold text-foreground">Discover Skills</Text>
        <Text className="text-[12px] text-muted">
          Browse and install skills from any GitHub repository.
        </Text>
        <View className="flex-row gap-2 pt-1">
          <View
            className={`min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border bg-surface-muted px-2.5 ${
              isFocused ? "border-primary" : "border-border"
            }`}
            style={{ borderCurve: "continuous" }}
          >
            <SFSymbol color={isFocused ? c.primary : c.muted} name="magnifyingglass" size={15} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className="min-w-0 flex-1 py-1.5 pl-1 text-[13px] text-foreground"
              enableFocusRing={false}
              focusRingType="none"
              onBlur={() => setIsFocused(false)}
              onChangeText={(t) => {
                setQuery(t);
                setError(null);
              }}
              onFocus={() => setIsFocused(true)}
              onSubmitEditing={() => void handleBrowse(query)}
              placeholder="anthropics/skills or GitHub URL"
              placeholderTextColor={c.muted}
              returnKeyType="search"
              value={query}
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                className="h-4 w-4 items-center justify-center rounded-full active:opacity-70"
                onPress={() => setQuery("")}
              >
                <SFSymbol color={c.muted} name="xmark.circle.fill" size={14} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: loading || query.trim() === "" }}
            className={loading || query.trim() === ""
              ? "rounded-lg bg-surface-muted px-3.5 py-1.5 opacity-50"
              : "rounded-lg bg-primary px-3.5 py-1.5"}
            style={{ borderCurve: "continuous" }}
            disabled={loading || query.trim() === ""}
            onPress={() => void handleBrowse(query)}
          >
            <Text className={loading || query.trim() === "" ? "text-[13px] font-medium text-muted" : "text-[13px] font-semibold text-white"}>
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
              <Text className="text-[12px] font-semibold text-primary">← Back</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1">
            <View className="gap-2 px-2 pb-4">
              {items.map((item) => {
                const installed = isInstalled(item);
                const busy = installing === item.path;
                return (
                  <View
                    className="flex-row items-center rounded-lg border border-border bg-surface-muted px-3 py-2"
                    style={{ borderCurve: "continuous" }}
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
                      className={installed
                        ? "flex-row items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5"
                        : busy
                        ? "flex-row items-center gap-1.5 rounded-lg bg-primary/60 px-3 py-1.5"
                        : "flex-row items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5"}
                      style={{ borderCurve: "continuous" }}
                      disabled={installed || busy}
                      onPress={() => handleInstall(item)}
                    >
                      <SFSymbol
                        color={installed ? c.muted : "#ffffff"}
                        name={installed ? "checkmark" : "square.and.arrow.down"}
                        size={13}
                      />
                      <Text
                        className={installed
                          ? "text-[12px] font-medium text-muted"
                          : "text-[12px] font-semibold text-white"}
                      >
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
