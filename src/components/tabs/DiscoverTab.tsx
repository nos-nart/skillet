import React, { useReducer, useState, useEffect } from "react";
import * as stylex from "@stylexjs/stylex";
import { MagnifyingGlassIcon, DownloadSimpleIcon, CheckCircleIcon, FolderOpenIcon, ArrowSquareOutIcon, BookmarkSimpleIcon, PlusIcon, TerminalWindowIcon, CpuIcon, StackIcon } from "@phosphor-icons/react";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import { ScrollArea } from "../ui/scroll-area.tsx";
import { Skill } from "../../types/skills.ts";
import { AddBookmarkDialog } from "../AddBookmarkDialog.tsx";
import { api } from "../../client/apiClient.ts";
import { colors, iconSizes } from "../../tokens.stylex.ts";
import { AnthropicLogo, CursorLogo, VercelLogo, CloudflareLogo, ExpoLogo } from "../AgentLogos.tsx";
import { SuspenseImage } from "../SuspenseImage.tsx";

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    backgroundColor: colors.bgPrimary,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottom: `1px solid ${colors.borderDefault}`,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  form: {
    display: "flex",
    gap: 8,
  },
  searchWrapper: {
    position: "relative" as const,
    flex: 1,
  },
  searchIcon: {
    position: "absolute" as const,
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.textMuted,
    pointerEvents: "none" as const,
  },
  error: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: colors.destructiveSoft,
    color: colors.destructiveHover,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.destructiveBorder,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  bookmarkItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
    cursor: "pointer",
    transitionProperty: "border-color",
    transitionDuration: "150ms",
    ":hover": {
      borderColor: colors.primary,
    },
  },
  bookmarkLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  bookmarkName: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  repoCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
    cursor: "pointer",
    transitionProperty: "border-color, transform, box-shadow",
    transitionDuration: "150ms",
    ":hover": {
      borderColor: colors.borderSubtle,
      transform: "translateY(-1.5px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
    },
    ":active": {
      transform: "scale(0.99)",
    },
  },
  repoCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1ch",
  },
  repoCardTitle: {
    fontWeight: 600,
    fontSize: 13,
    color: colors.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  repoCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 1.45,
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderSubtle,
  },
  resultPath: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "monospace",
    fontSize: 12,
  },
  skillItem: {
    display: "flex",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.02)",
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "150ms",
    ":hover": {
      borderColor: colors.borderSubtle,
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
    },
  },
  skillContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
  },
  skillNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  skillName: {
    fontWeight: 600,
    fontSize: 14,
    color: colors.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  skillLink: {
    color: colors.textMuted,
    transitionProperty: "color",
    transitionDuration: "150ms",
  },
  skillDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    display: "-webkit-box" as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  installed: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1ch",
    color: colors.success,
  },
  installRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1ch",
  },
  emptyStack: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  bookmarkGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
  },
  repoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  resultStack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  skillStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  removeBtn: {
    padding: 4,
    color: colors.textMuted,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    cursor: "pointer",
  },
});

interface PopularRepo {
  owner: string;
  repo: string;
  fullName: string;
  desc: string;
  fallbackIcon?: React.ReactNode;
}

const POPULAR_REPOS: PopularRepo[] = [
  {
    owner: "anthropics",
    repo: "skills",
    fullName: "anthropics/skills",
    desc: "Official Anthropic agent skills and guidelines.",
    fallbackIcon: <AnthropicLogo style={{ width: 22, height: 22, color: "#D97757", flexShrink: 0 }} />,
  },
  {
    owner: "cursor",
    repo: "plugins",
    fullName: "cursor/plugins",
    desc: "Official Cursor community skills repository.",
    fallbackIcon: <CursorLogo style={{ width: 22, height: 22, color: colors.textPrimary, flexShrink: 0 }} />,
  },
  {
    owner: "vercel-labs",
    repo: "skills",
    fullName: "vercel-labs/skills",
    desc: "Foundational skills and examples from Vercel.",
    fallbackIcon: <VercelLogo style={{ width: 22, height: 22, color: colors.textPrimary, flexShrink: 0 }} />,
  },
  {
    owner: "cloudflare",
    repo: "skills",
    fullName: "cloudflare/skills",
    desc: "Skills for teaching agents to build on Cloudflare.",
    fallbackIcon: <CloudflareLogo style={{ width: 22, height: 22, color: "#F38020", flexShrink: 0 }} />,
  },
  {
    owner: "expo",
    repo: "skills",
    fullName: "expo/skills",
    desc: "Official AI agent skills for Expo & React Native.",
    fallbackIcon: <ExpoLogo style={{ width: 22, height: 22, color: "#5856D6", flexShrink: 0 }} />,
  },
  {
    owner: "mattpocock",
    repo: "skills",
    fullName: "mattpocock/skills",
    desc: "Skills for Real Engineers by Matt Pocock.",
    fallbackIcon: <TerminalWindowIcon style={{ width: 22, height: 22, color: "#3178C6", flexShrink: 0 }} />,
  },
  {
    owner: "addyosmani",
    repo: "agent-skills",
    fullName: "addyosmani/agent-skills",
    desc: "Production-grade engineering skills by Addy Osmani.",
    fallbackIcon: <CpuIcon style={{ width: 22, height: 22, color: "#8B5CF6", flexShrink: 0 }} />,
  },
  {
    owner: "garrytan",
    repo: "gstack",
    fullName: "garrytan/gstack",
    desc: "Garry Tan's Claude Code setup with 23+ skills & tools.",
    fallbackIcon: <StackIcon style={{ width: 22, height: 22, color: "#F59E0B", flexShrink: 0 }} />,
  },
];

function PopularRepoAvatar({ owner, fallback }: { owner: string; fallback?: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bgTertiary, flexShrink: 0 }}>
        {fallback || <FolderOpenIcon style={{ width: 20, height: 20, color: colors.textMuted }} />}
      </div>
    );
  }

  return (
    <SuspenseImage
      src={`https://github.com/${owner}.png?size=96`}
      alt={owner}
      data-testid="github-avatar"
      onError={() => setHasError(true)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        objectFit: "cover",
        flexShrink: 0,
        backgroundColor: colors.bgTertiary,
      }}
      placeholderClassName="w-9 h-9 rounded-lg"
    />
  );
}

function GitHubAvatar({ owner, fallback }: { owner: string; fallback?: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <>{fallback || <FolderOpenIcon style={{ width: 20, height: 20, color: colors.textMuted, flexShrink: 0 }} />}</>;
  }

  return (
    <SuspenseImage
      src={`https://github.com/${owner}.png?size=64`}
      alt={owner}
      data-testid="github-avatar"
      onError={() => setHasError(true)}
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        objectFit: "cover",
        flexShrink: 0,
      }}
      placeholderClassName="w-5 h-5 rounded"
    />
  );
}

interface GitHubContentItem {
  name: string;
  path: string;
  type: string;
  html_url: string;
  description?: string;
}

interface DiscoverState {
  query: string;
  isLoading: boolean;
  error: string | null;
  items: GitHubContentItem[];
  repoInfo: { owner: string; repo: string; path?: string } | null;
  installingItem: string | null;
  bookmarks: string[];
}

type DiscoverAction = 
  | { type: "SET_QUERY"; payload: string }
  | { type: "SEARCH_START"; payload: { owner: string; repo: string; path?: string } }
  | { type: "SEARCH_SUCCESS"; payload: GitHubContentItem[] }
  | { type: "SEARCH_ERROR"; payload: string }
  | { type: "INSTALL_START"; payload: string }
  | { type: "INSTALL_END" }
  | { type: "SET_BOOKMARKS"; payload: string[] }
  | { type: "SET_ITEM_DESCRIPTION"; payload: { name: string; description: string } }
  | { type: "CLEAR_SEARCH" };

function discoverReducer(state: DiscoverState, action: DiscoverAction): DiscoverState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload };
    case "SEARCH_START":
      return { ...state, isLoading: true, error: null, items: [], repoInfo: action.payload };
    case "CLEAR_SEARCH":
      return { ...state, items: [], repoInfo: null, error: null, query: "" };
    case "SEARCH_SUCCESS":
      return { ...state, isLoading: false, items: action.payload };
    case "SEARCH_ERROR":
      return { ...state, isLoading: false, error: action.payload, items: [], repoInfo: null };
    case "INSTALL_START":
      return { ...state, installingItem: action.payload };
    case "INSTALL_END":
      return { ...state, installingItem: null };
    case "SET_BOOKMARKS":
      return { ...state, bookmarks: action.payload };
    case "SET_ITEM_DESCRIPTION":
      return {
        ...state,
        items: state.items.map(item =>
          item.name === action.payload.name ? { ...item, description: action.payload.description } : item
        )
      };
    default:
      return state;
  }
}

const initialState: DiscoverState = {
  query: "",
  isLoading: false,
  error: null,
  items: [],
  repoInfo: null,
  installingItem: null,
  bookmarks: []
};

export function DiscoverTab({ installedSkills, onInstall }: { installedSkills: Skill[], onInstall: (source: string) => Promise<void> }) {
  const [state, dispatch] = useReducer(discoverReducer, initialState);
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);

  useEffect(() => {
    api.getBookmarks().then((bms) => dispatch({ type: "SET_BOOKMARKS", payload: bms })).catch(console.error);
  }, []);

  const getCustomDefaultRepo = (ownerLower: string): string => {
    if (ownerLower === "garrytan") return "gstack";
    if (ownerLower === "addyosmani") return "agent-skills";
    if (ownerLower === "cursor") return "plugins";
    return "skills";
  };

  const KNOWN_SKILLS_CREATORS = new Set([
    "anthropics",
    "cursor",
    "vercel-labs",
    "cloudflare",
    "expo",
    "mattpocock",
    "addyosmani",
    "garrytan",
  ]);

  const parseRepo = (input: string) => {
    const cleaned = input.trim().replace(/\.git$/, "").replace(/\/$/, "");
    const skillsShMatch = cleaned.match(/^https?:\/\/(?:www\.)?skills\.sh\/([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
    if (skillsShMatch) return { owner: skillsShMatch[1], repo: skillsShMatch[2], path: skillsShMatch[3] || undefined };

    const skillsShOwnerMatch = cleaned.match(/^https?:\/\/(?:www\.)?skills\.sh\/([\w.-]+)$/);
    if (skillsShOwnerMatch) {
      const owner = skillsShOwnerMatch[1];
      return { owner, repo: getCustomDefaultRepo(owner.toLowerCase()) };
    }

    const httpsMatch = cleaned.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:tree|blob)\/[^/]+\/(.*)|\/.*)?$/);
    if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2], path: httpsMatch[3] || undefined };

    const shortMatch = cleaned.match(/^([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
    if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2], path: shortMatch[3] || undefined };

    const lower = cleaned.toLowerCase();
    if (/^[\w.-]+$/.test(cleaned) && KNOWN_SKILLS_CREATORS.has(lower)) {
      return { owner: cleaned, repo: getCustomDefaultRepo(lower) };
    }

    return null;
  };

  const fetchDescription = async (owner: string, repo: string, itemPath: string, name: string, branch: string = "main") => {
    try {
      let url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${itemPath ? `${itemPath}/` : ""}SKILL.md`;
      let res = await fetch(url);
      if (!res.ok) {
        url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${itemPath ? `${itemPath}/` : ""}README.md`;
        res = await fetch(url);
      }
      if (res.ok) {
        const text = await res.text();
        const descMatch = text.match(/description:\s*(.+)/i) || text.match(/^#\s+.*?\n+(.+?)(?=\n|$)/m);
        if (descMatch && descMatch[1]) {
          let desc = descMatch[1].trim();
          if (desc.startsWith(">")) desc = desc.substring(1).trim();
          dispatch({ type: "SET_ITEM_DESCRIPTION", payload: { name, description: desc } });
        }
      }
    } catch { /* ignore */ }
  };

  const handleSearch = async (e?: React.SyntheticEvent, directQuery?: string) => {
    e?.preventDefault();
    const searchQuery = directQuery !== undefined ? directQuery : state.query;
    if (!searchQuery.trim()) return;
    if (directQuery !== undefined) dispatch({ type: "SET_QUERY", payload: directQuery });
    const info = parseRepo(searchQuery);
    if (!info) { dispatch({ type: "SEARCH_ERROR", payload: "Invalid format. Use owner/repo or a skills.sh URL." }); return; }
    dispatch({ type: "SEARCH_START", payload: info });
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${info.owner}/${info.repo}`);
      if (!repoRes.ok) throw new Error("Repository not found");
      const repoData = await repoRes.json();
      const branch = repoData.default_branch;
      const treeRes = await fetch(`https://api.github.com/repos/${info.owner}/${info.repo}/git/trees/${branch}?recursive=1`);
      if (!treeRes.ok) throw new Error("Failed to fetch repository tree");
      const treeData = await treeRes.json();
      const skillFiles = treeData.tree.filter((t: any) => t.type === "blob" && (t.path.endsWith("SKILL.md") || t.path.endsWith(".cursorrules") || t.path.endsWith("cursorrules")));
      let targetFiles = skillFiles;
      if (info.path) {
        targetFiles = skillFiles.filter((t: any) => t.path === info.path || t.path.startsWith(`${info.path}/`));
        if (targetFiles.length === 0) throw new Error("No skills found at this path");
      }
      if (targetFiles.length === 0) throw new Error("No skills found in this repository");
      const items: GitHubContentItem[] = targetFiles.map((file: any) => {
        const parts = file.path.split("/");
        parts.pop();
        const skillPath = parts.join("/");
        const skillName = parts.length > 0 ? parts[parts.length - 1] : info.repo;
        return { name: skillName, path: skillPath, type: "dir", html_url: `https://github.com/${info.owner}/${info.repo}/tree/${branch}/${skillPath}` };
      });
      const uniqueItems = Array.from(new Map(items.map(item => [item.path, item])).values());
      dispatch({ type: "SEARCH_SUCCESS", payload: uniqueItems });
      uniqueItems.forEach(item => { fetchDescription(info.owner, info.repo, item.path, item.name, branch); });
    } catch (err: any) {
      dispatch({ type: "SEARCH_ERROR", payload: err.message || "Failed to fetch repository" });
    }
  };

  const handleBack = () => { dispatch({ type: "CLEAR_SEARCH" }); };

  const handleInstall = async (item: GitHubContentItem) => {
    if (!state.repoInfo) return;
    dispatch({ type: "INSTALL_START", payload: item.name });
    try {
      const source = `${state.repoInfo.owner}/${state.repoInfo.repo}${item.path ? `/${item.path}` : ""}`;
      await onInstall(source);
    } catch (err: any) {
      alert(`Install failed: ${err.message}`);
    } finally {
      dispatch({ type: "INSTALL_END" });
    }
  };

  const handleSaveBookmarks = async (urls: string[]) => {
    try {
      const updated = Array.from(new Set([...state.bookmarks, ...urls]));
      await api.saveBookmarks(updated);
      dispatch({ type: "SET_BOOKMARKS", payload: updated });
    } catch (err) { console.error("Failed to save bookmarks:", err); }
  };

  const handleRemoveBookmark = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    try {
      const updated = state.bookmarks.filter(b => b !== url);
      await api.saveBookmarks(updated);
      dispatch({ type: "SET_BOOKMARKS", payload: updated });
    } catch (err) { console.error("Failed to remove bookmark:", err); }
  };

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.headerTop)}>
          <h2 {...stylex.props(styles.title)}>Discover Skills</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsBookmarkDialogOpen(true)}>
            <PlusIcon weight="bold" /> Bookmark
          </Button>
        </div>
        <p {...stylex.props(styles.desc)}>Browse and install skills from skills.sh or any GitHub repository.</p>
        
        <form onSubmit={handleSearch} {...stylex.props(styles.form)}>
          <div {...stylex.props(styles.searchWrapper)}>
            <MagnifyingGlassIcon {...stylex.props(styles.searchIcon)} weight="light" style={iconSizes.md} />
            <Input
              value={state.query}
              onChange={(e) => dispatch({ type: "SET_QUERY", payload: e.target.value })}
              placeholder="e.g. anthropics/skills, cloudflare/skills, or https://www.skills.sh/garrytan"
              style={{ paddingLeft: 36, height: 36, width: "100%" }}
            />
          </div>
          <Button type="submit" disabled={state.isLoading} style={{ height: 36, paddingLeft: 16, paddingRight: 16 }}>
            {state.isLoading ? "Searching..." : "Browse"}
          </Button>
        </form>
      </div>

      <ScrollArea style={{ flex: 1 }} contentStyle={{ padding: "20px 24px" }}>
        {state.error && (
          <div {...stylex.props(styles.error)}>{state.error}</div>
        )}

        {!state.isLoading && !state.error && state.items.length === 0 && !state.repoInfo && (
          <div {...stylex.props(styles.emptyStack)}>
            {state.bookmarks.length > 0 && (
              <div>
                <h3 {...stylex.props(styles.sectionTitle)}>
                  <BookmarkSimpleIcon weight="fill" style={{ ...iconSizes.md, color: colors.primary }} /> Your Bookmarks
                </h3>
                <div {...stylex.props(styles.bookmarkGrid)}>
                  {state.bookmarks.map(bm => {
                    const info = parseRepo(bm);
                    const displayName = info ? `${info.owner}/${info.repo}${info.path ? `/${info.path}` : ""}` : bm;
                    return (
                      <div key={bm} onClick={(e) => { handleSearch(e, bm); }} {...stylex.props(styles.bookmarkItem)}>
                        <div {...stylex.props(styles.bookmarkLeft)}>
                          <BookmarkSimpleIcon style={{ ...iconSizes.md, color: colors.textMuted }} />
                          <span {...stylex.props(styles.bookmarkName)}>{displayName}</span>
                        </div>
                        <button onClick={(e) => handleRemoveBookmark(e, bm)} {...stylex.props(styles.removeBtn)}>
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div>
              <h3 {...stylex.props(styles.sectionTitle)}>Popular Repositories</h3>
              <div {...stylex.props(styles.repoGrid)}>
                {POPULAR_REPOS.map((r) => (
                  <div
                    key={r.fullName}
                    {...stylex.props(styles.repoCard)}
                    onClick={(e) => { handleSearch(e, r.fullName); }}
                  >
                    <div {...stylex.props(styles.repoCardHeader)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.2ch", flex: 1, minWidth: 0 }}>
                        <PopularRepoAvatar owner={r.owner} fallback={r.fallbackIcon} />
                        <h3 {...stylex.props(styles.repoCardTitle)}>{r.fullName}</h3>
                      </div>
                      <a
                        href={`https://github.com/${r.fullName}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`Open ${r.fullName} on GitHub`}
                        style={{
                          color: colors.textMuted,
                          display: "inline-flex",
                          alignItems: "center",
                          padding: 2,
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        <ArrowSquareOutIcon style={{ width: 14, height: 14 }} />
                      </a>
                    </div>
                    <p {...stylex.props(styles.repoCardDesc)}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.items.length > 0 && state.repoInfo && (
          <div {...stylex.props(styles.resultStack)}>
            <div {...stylex.props(styles.resultHeader)}>
              <div {...stylex.props(styles.resultPath)}>
                <GitHubAvatar owner={state.repoInfo.owner} />
                <span>{state.repoInfo.owner} / {state.repoInfo.repo} {state.repoInfo.path ? `/ ${state.repoInfo.path}` : ""}</span>
                <a
                  href={`https://github.com/${state.repoInfo.owner}/${state.repoInfo.repo}`}
                  target="_blank"
                  rel="noreferrer"
                  title="View on GitHub"
                  style={{ color: colors.textMuted, display: "inline-flex", alignItems: "center", marginLeft: 4 }}
                >
                  <ArrowSquareOutIcon style={{ width: 14, height: 14 }} />
                </a>
              </div>
              <Button variant="ghost" size="sm" onClick={handleBack}>&larr; Back</Button>
            </div>
            
            <div {...stylex.props(styles.skillStack)}>
              {state.items.map((item) => {
                const isInstalled = installedSkills.some(s => (s.packageName === `${state.repoInfo!.owner}/${state.repoInfo!.repo}` || s.packageName === state.repoInfo!.owner) && s.slug === item.name);
                const isInstalling = state.installingItem === item.name;
                return (
                  <div key={item.path} {...stylex.props(styles.skillItem)}>
                    <div {...stylex.props(styles.skillContent)}>
                      <div {...stylex.props(styles.skillNameRow)}>
                        <h3 {...stylex.props(styles.skillName)} title={item.name}>{item.name}</h3>
                        <a href={item.html_url} target="_blank" rel="noreferrer" {...stylex.props(styles.skillLink)}>
                          <ArrowSquareOutIcon style={iconSizes.md} />
                        </a>
                      </div>
                      <p {...stylex.props(styles.skillDesc)}>
                        {item.description || "No description available. Click install to fetch and add this skill to your workspace."}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <Button
                        variant={isInstalled ? "secondary" : "default"}
                        size="sm"
                        disabled={isInstalled || isInstalling}
                        onClick={() => handleInstall(item)}
                        style={{ minWidth: 104, fontSize: 12, height: 32, paddingLeft: 12, paddingRight: 12 }}
                      >
                        {isInstalling ? "Installing..." : isInstalled ? (
                          <span {...stylex.props(styles.installed)}>
                            <CheckCircleIcon weight="fill" style={{ width: 16, height: 16, flexShrink: 0 }} />
                            <span>Installed</span>
                          </span>
                        ) : (
                          <span {...stylex.props(styles.installRow)}>
                            <DownloadSimpleIcon weight="bold" style={{ width: 16, height: 16, flexShrink: 0 }} />
                            <span>Install</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>

      <AddBookmarkDialog
        isOpen={isBookmarkDialogOpen}
        onClose={() => setIsBookmarkDialogOpen(false)}
        onSave={handleSaveBookmarks}
      />
    </div>
  );
}
