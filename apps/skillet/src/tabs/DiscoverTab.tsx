import React, { useCallback, useState } from "react";
import { Image, Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import { Text } from "../AppText";
import { ErrorBanner } from "../ErrorBanner";
import { SFSymbol } from "@legend-apps/sf-symbol";
import { useAtom } from "@effect/atom-react";
import * as Atom from "effect/unstable/reactivity/Atom";
import * as Cause from "effect/Cause";
import {
  browseRepoAtom,
  formatDiscoverError,
  installingSkillAtom,
} from "../services/discoverAtoms";
import {
  buildInstallSource,
  POPULAR_REPOS,
  type DiscoveredSkillItem,
  type FetchFn,
  type GitHubRepoInfo,
} from "../services/github";
import type { Skill } from "../services/skills";
import { useThemePalette } from "../services/theme";

const CONTINUOUS_CURVE = { borderCurve: "continuous" } as const;
const POPULAR_CARD_STYLE = { borderCurve: "continuous", flexBasis: "48%", flexGrow: 1, minWidth: 260 } as const;
const DISABLED_STATE = { disabled: true } as const;
const ENABLED_STATE = { disabled: false } as const;

const PopularRepoCard = React.memo(function PopularRepoCard({
  repo,
  onSelect,
}: {
  repo: (typeof POPULAR_REPOS)[number];
  onSelect: (fullName: string) => void;
}): React.JSX.Element {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const c = useThemePalette();

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-lg border border-border bg-surface p-3.5 active:bg-surface-muted/80"
      onPress={() => onSelect(repo.fullName)}
      style={POPULAR_CARD_STYLE}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
          {avatarFailed ? (
            <View
              className="h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-muted"
              style={CONTINUOUS_CURVE}
            >
              <SFSymbol color={c.muted} name="shippingbox" size={15} />
            </View>
          ) : (
            <Image
              accessibilityLabel={`${repo.owner} avatar`}
              className="h-7 w-7 rounded-md"
              onError={() => setAvatarFailed(true)}
              source={{ uri: `https://github.com/${repo.owner}.png?size=64` }}
            />
          )}
          <Text className="min-w-0 flex-1 text-[13px] font-bold text-foreground" numberOfLines={1}>
            {repo.fullName}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`Open ${repo.fullName} on GitHub`}
          accessibilityRole="button"
          className="h-6 w-6 items-center justify-center rounded active:opacity-60"
          onPress={(e) => {
            e.stopPropagation();
            void Linking.openURL(`https://github.com/${repo.fullName}`).catch(() => {});
          }}
        >
          <SFSymbol color={c.muted} name="arrow.up.right.square" size={14} />
        </Pressable>
      </View>
      <Text className="pt-2 text-[12px] leading-4 text-muted" numberOfLines={2}>
        {repo.desc}
      </Text>
      <View className="flex-row items-center gap-1 pt-2.5">
        <Text className="text-[11px] font-semibold text-primary">Browse skills</Text>
        <SFSymbol color={c.primary} name="chevron.right" size={10} />
      </View>
    </Pressable>
  );
});

const DiscoveredSkillCard = React.memo(function DiscoveredSkillCard({
  item,
  repoOwner,
  repoName,
  installed,
  busy,
  onInstall,
  mutedColor,
}: {
  item: DiscoveredSkillItem;
  repoOwner: string;
  repoName: string;
  installed: boolean;
  busy: boolean;
  onInstall: (item: DiscoveredSkillItem) => void;
  mutedColor: string;
}): React.JSX.Element {
  return (
    <View
      className="flex-row items-center rounded-lg border border-border bg-surface px-3.5 py-2.5"
      style={CONTINUOUS_CURVE}
    >
      <View className="flex-1 pr-3">
        <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="pt-0.5 text-[11px] text-muted" numberOfLines={1}>
          {item.path === "" ? `${repoOwner}/${repoName}` : item.path}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={installed || busy ? DISABLED_STATE : ENABLED_STATE}
        className={installed
          ? "flex-row items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5"
          : busy
          ? "flex-row items-center gap-1.5 rounded-lg bg-primary/60 px-3 py-1.5"
          : "flex-row items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5"}
        style={CONTINUOUS_CURVE}
        disabled={installed || busy}
        onPress={() => onInstall(item)}
      >
        <SFSymbol
          color={installed ? mutedColor : "#ffffff"}
          name={installed ? "checkmark" : "square.and.arrow.down"}
          size={15}
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
});

interface DiscoverSearchBarProps {
  query: string;
  isFocused: boolean;
  loading: boolean;
  error: string | null;
  primaryColor: string;
  mutedColor: string;
  onFocus: () => void;
  onBlur: () => void;
  onChangeQuery: (text: string) => void;
  onClearQuery: () => void;
  onSubmit: () => void;
}

const SEARCH_INPUT_STYLE = { fontFamily: "Space Grotesk" } as const;

function DiscoverSearchBar({
  query,
  isFocused,
  loading,
  error,
  primaryColor,
  mutedColor,
  onFocus,
  onBlur,
  onChangeQuery,
  onClearQuery,
  onSubmit,
}: DiscoverSearchBarProps): React.JSX.Element {
  const isBrowseDisabled = loading || query.trim() === "";

  return (
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
          style={CONTINUOUS_CURVE}
        >
          <SFSymbol color={isFocused ? primaryColor : mutedColor} name="magnifyingglass" size={17} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="min-w-0 flex-1 py-1.5 pl-1 text-[13px] text-foreground"
            enableFocusRing={false}
            focusRingType="none"
            onBlur={onBlur}
            onChangeText={onChangeQuery}
            onFocus={onFocus}
            onSubmitEditing={onSubmit}
            placeholder="anthropics/skills or GitHub URL"
            placeholderTextColor={mutedColor}
            returnKeyType="search"
            style={SEARCH_INPUT_STYLE}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              className="h-4 w-4 items-center justify-center rounded-full active:opacity-70"
              onPress={onClearQuery}
            >
              <SFSymbol color={mutedColor} name="xmark.circle.fill" size={16} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isBrowseDisabled }}
          className={
            isBrowseDisabled
              ? "rounded-lg bg-surface-muted px-3.5 py-1.5 opacity-50"
              : "rounded-lg bg-primary px-3.5 py-1.5"
          }
          disabled={isBrowseDisabled}
          onPress={onSubmit}
          style={CONTINUOUS_CURVE}
        >
          <Text
            className={
              isBrowseDisabled
                ? "text-[13px] font-medium text-muted"
                : "text-[13px] font-semibold text-white"
            }
          >
            {loading ? "Browsing…" : "Browse"}
          </Text>
        </Pressable>
      </View>
      <ErrorBanner className="mt-2" error={error} />
    </View>
  );
}

interface DiscoveredRepoViewProps {
  repo: GitHubRepoInfo;
  items: DiscoveredSkillItem[];
  installing: string | null;
  installedSkills: Skill[];
  primaryColor: string;
  mutedColor: string;
  onBack: () => void;
  onInstall: (item: DiscoveredSkillItem) => void;
}

function DiscoveredRepoView({
  repo,
  items,
  installing,
  installedSkills,
  primaryColor,
  mutedColor,
  onBack,
  onInstall,
}: DiscoveredRepoViewProps): React.JSX.Element {
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-2.5 px-4 pb-3">
        {avatarFailed ? null : (
          <Image
            accessibilityLabel={`${repo.owner} avatar`}
            className="h-6 w-6 rounded-md"
            onError={() => setAvatarFailed(true)}
            source={{ uri: `https://github.com/${repo.owner}.png?size=64` }}
          />
        )}
        <Text className="flex-1 text-[13px] font-bold text-foreground" numberOfLines={1}>
          {`${repo.owner} / ${repo.repo}${repo.path ? ` / ${repo.path}` : ""}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-1 rounded-md bg-surface-muted px-2.5 py-1 active:opacity-70"
          onPress={onBack}
          style={CONTINUOUS_CURVE}
        >
          <SFSymbol color={primaryColor} name="chevron.left" size={12} />
          <Text className="text-[12px] font-semibold text-primary">Back</Text>
        </Pressable>
      </View>
      <ScrollView className="flex-1">
        <View className="gap-2 px-4 pb-4">
          {items.map((item) => {
            const isInstalled = installedSkills.some(
              (s) =>
                (s.packageName === `${repo.owner}/${repo.repo}` || s.packageName === repo.owner) &&
                s.slug === item.name,
            );
            return (
              <DiscoveredSkillCard
                busy={installing === item.path}
                installed={isInstalled}
                item={item}
                key={item.path === "" ? item.name : item.path}
                mutedColor={mutedColor}
                onInstall={onInstall}
                repoName={repo.repo}
                repoOwner={repo.owner}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

interface PopularReposViewProps {
  onSelectRepo: (fullName: string) => void;
}

function PopularReposView({ onSelectRepo }: PopularReposViewProps): React.JSX.Element {
  return (
    <ScrollView className="flex-1">
      <View className="gap-3 px-4 pb-6 pt-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Popular Repositories
          </Text>
          <Text className="text-[11px] text-muted">
            {POPULAR_REPOS.length} featured repos
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {POPULAR_REPOS.map((r) => (
            <PopularRepoCard
              key={r.fullName}
              onSelect={onSelectRepo}
              repo={r}
            />
          ))}
        </View>
        <Text className="pt-1 text-[11px] text-muted">
          Select a repository to explore and install its skills, or search any owner/repo above.
        </Text>
      </View>
    </ScrollView>
  );
}

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

  // Declarative Effect Atoms replace fragmented useState + activeRequestIdRef
  const [browseResult, browseRepo] = useAtom(browseRepoAtom);
  const [installing, setInstalling] = useAtom(installingSkillAtom);

  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);

  const loading = browseResult.waiting;
  const repo = browseResult._tag === "Success" ? browseResult.value.repo : null;
  const items = browseResult._tag === "Success" ? browseResult.value.items : [];
  const error =
    browseResult._tag === "Failure"
      ? formatDiscoverError(Cause.squash(browseResult.cause))
      : null;

  const handleBrowse = useCallback(
    (raw: string): void => {
      const trimmed = raw.trim();
      if (trimmed === "" || loading) return;
      browseRepo({ query: trimmed, token, fetchImpl });
    },
    [browseRepo, loading, token, fetchImpl],
  );

  const handleInstall = useCallback(
    (item: DiscoveredSkillItem): void => {
      if (!repo || installing) return;
      const source = buildInstallSource(repo, item.path);
      setInstalling(item.path);
      setInstallError(null);
      setInstallSuccess(null);
      void Promise.resolve()
        .then(() => onInstall(source))
        .then(() => {
          setInstallSuccess(`Installed "${item.name}"`);
        })
        .catch((cause: unknown) => {
          setInstallError(cause instanceof Error ? cause.message : "Could not install skill.");
        })
        .finally(() => {
          setInstalling(null);
        });
    },
    [repo, installing, onInstall, setInstalling],
  );

  const handleClearQuery = useCallback(() => {
    setQuery("");
    if (browseResult._tag === "Failure") {
      browseRepo(Atom.Reset);
    }
  }, [browseRepo, browseResult._tag]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const handleChangeQuery = useCallback(
    (t: string) => {
      setQuery(t);
      if (browseResult._tag === "Failure") {
        browseRepo(Atom.Reset);
      }
    },
    [browseRepo, browseResult._tag],
  );

  const handleSubmitQuery = useCallback(() => {
    handleBrowse(query);
  }, [handleBrowse, query]);

  const handleBack = useCallback(() => {
    browseRepo(Atom.Reset);
    setQuery("");
    setInstallError(null);
    setInstallSuccess(null);
  }, [browseRepo]);

  const handleSelectRepo = useCallback(
    (fullName: string) => {
      setQuery(fullName);
      handleBrowse(fullName);
    },
    [handleBrowse],
  );

  return (
    <View className="flex-1 bg-background">
      <DiscoverSearchBar
        error={error}
        isFocused={isFocused}
        loading={loading}
        mutedColor={c.muted}
        onBlur={handleBlur}
        onChangeQuery={handleChangeQuery}
        onClearQuery={handleClearQuery}
        onFocus={handleFocus}
        onSubmit={handleSubmitQuery}
        primaryColor={c.primary}
        query={query}
      />
      <ErrorBanner
        className="mx-4 mb-2"
        error={installError}
        onDismiss={() => setInstallError(null)}
      />
      {installSuccess ? (
        <View className="mx-4 mb-2 flex-row items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5">
          <Text className="text-[11px] font-medium text-primary">{installSuccess}</Text>
          <Pressable
            accessibilityLabel="Dismiss message"
            accessibilityRole="button"
            className="pl-2"
            onPress={() => setInstallSuccess(null)}
          >
            <SFSymbol color={c.primary} name="xmark" size={12} />
          </Pressable>
        </View>
      ) : null}
      {repo ? (
        <DiscoveredRepoView
          installedSkills={installedSkills}
          installing={installing}
          items={items}
          mutedColor={c.muted}
          onBack={handleBack}
          onInstall={handleInstall}
          primaryColor={c.primary}
          repo={repo}
        />
      ) : (
        <PopularReposView onSelectRepo={handleSelectRepo} />
      )}
    </View>
  );
}
