import React, { useReducer, useState, useEffect } from "react";
import { MagnifyingGlass, DownloadSimple, CheckCircle, FolderOpen, ArrowSquareOut, BookmarkSimple, Plus } from "@phosphor-icons/react";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import { ScrollArea } from "../ui/scroll-area.tsx";
import { Skill } from "../../types/skills.ts";
import { AddBookmarkDialog } from "../AddBookmarkDialog.tsx";
import { api } from "../../client/apiClient.ts";

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
  | { type: "SET_ITEM_DESCRIPTION"; payload: { name: string; description: string } };

function discoverReducer(state: DiscoverState, action: DiscoverAction): DiscoverState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload };
    case "SEARCH_START":
      return { ...state, isLoading: true, error: null, items: [], repoInfo: action.payload };
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

  const parseRepo = (input: string) => {
    let cleaned = input.trim().replace(/\.git$/, "").replace(/\/$/, "");
    const skillsShMatch = cleaned.match(/^https?:\/\/(?:www\.)?skills\.sh\/([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
    if (skillsShMatch) return { owner: skillsShMatch[1], repo: skillsShMatch[2], path: skillsShMatch[3] || undefined };

    const httpsMatch = cleaned.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:tree|blob)\/[^/]+\/(.*))?$/);
    if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2], path: httpsMatch[3] || undefined };

    const shortMatch = cleaned.match(/^([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
    if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2], path: shortMatch[3] || undefined };
    
    return null;
  };

  const fetchDescription = async (owner: string, repo: string, itemPath: string, name: string) => {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${itemPath}/SKILL.md`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const descMatch = text.match(/description:\s*(.+)/i);
        if (descMatch && descMatch[1]) {
          dispatch({ type: "SET_ITEM_DESCRIPTION", payload: { name, description: descMatch[1].trim() } });
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSearch = async (e: React.FormEvent, directQuery?: string) => {
    e.preventDefault();
    const searchQuery = directQuery !== undefined ? directQuery : state.query;
    if (!searchQuery.trim()) return;

    if (directQuery !== undefined) {
      dispatch({ type: "SET_QUERY", payload: directQuery });
    }

    const info = parseRepo(searchQuery);
    if (!info) {
      dispatch({ type: "SEARCH_ERROR", payload: "Invalid format. Use owner/repo (e.g. cursor/plugins) or a skills.sh URL." });
      return;
    }

    dispatch({ type: "SEARCH_START", payload: info });

    try {
      const url = `https://api.github.com/repos/${info.owner}/${info.repo}/contents${info.path ? `/${info.path}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Repository or path not found");
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        if (data.name === "SKILL.md") {
          const item = { name: info.path?.split("/").pop() || info.repo, path: info.path || "", type: "dir", html_url: data.html_url.replace(/\/SKILL\.md$/, "") };
          dispatch({ type: "SEARCH_SUCCESS", payload: [item] });
          fetchDescription(info.owner, info.repo, item.path, item.name);
        } else {
          throw new Error("No skills found at this path");
        }
      } else {
        // If the directory contains SKILL.md, it is a skill itself!
        if (data.some((d: any) => d.name === "SKILL.md")) {
          const item = { name: info.path?.split("/").pop() || info.repo, path: info.path || "", type: "dir", html_url: `https://github.com/${info.owner}/${info.repo}${info.path ? `/tree/main/${info.path}` : ""}` };
          dispatch({ type: "SEARCH_SUCCESS", payload: [item] });
          fetchDescription(info.owner, info.repo, item.path, item.name);
        } else {
          const dirs = data.filter((item: any) => item.type === "dir");
          dispatch({ type: "SEARCH_SUCCESS", payload: dirs });
          
          // Fetch descriptions async
          dirs.forEach((d: any) => {
            fetchDescription(info.owner, info.repo, d.path, d.name);
          });
        }
      }
    } catch (err: any) {
      dispatch({ type: "SEARCH_ERROR", payload: err.message || "Failed to fetch repository" });
    }
  };

  const handleBack = () => {
    dispatch({ type: "SEARCH_SUCCESS", payload: [] });
    dispatch({ type: "SET_QUERY", payload: "" });
  };

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
    } catch (err) {
      console.error("Failed to save bookmarks:", err);
    }
  };

  const handleRemoveBookmark = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    try {
      const updated = state.bookmarks.filter(b => b !== url);
      await api.saveBookmarks(updated);
      dispatch({ type: "SET_BOOKMARKS", payload: updated });
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950">
      <div className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Discover Skills</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsBookmarkDialogOpen(true)} className="h-8 gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <Plus weight="bold" /> Bookmark
          </Button>
        </div>
        <p className="text-sm text-zinc-500 mb-6">Browse and install skills from skills.sh or any GitHub repository.</p>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={state.query}
              onChange={(e) => dispatch({ type: "SET_QUERY", payload: e.target.value })}
              placeholder="e.g. cursor/plugins or https://www.skills.sh/cursor/plugins"
              className="pl-9 h-10 w-full"
            />
          </div>
          <Button type="submit" disabled={state.isLoading} className="h-10 px-5">
            {state.isLoading ? "Searching..." : "Browse"}
          </Button>
        </form>
      </div>

      <ScrollArea className="flex-1 p-6">
        {state.error && (
          <div className="p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-sm">
            {state.error}
          </div>
        )}

        {!state.isLoading && !state.error && state.items.length === 0 && !state.repoInfo && (
          <div className="space-y-6">
            {state.bookmarks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <BookmarkSimple className="text-orange-500" weight="fill" /> Your Bookmarks
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {state.bookmarks.map(bm => {
                    const info = parseRepo(bm);
                    const displayName = info ? `${info.owner}/${info.repo}${info.path ? `/${info.path}` : ""}` : bm;
                    return (
                      <div key={bm} onClick={(e) => { /* SAFETY: wrapper */ handleSearch(e as any, bm); }} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-orange-500/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2 truncate">
                          <BookmarkSimple className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{displayName}</span>
                        </div>
                        <button onClick={(e) => handleRemoveBookmark(e, bm)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all">
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Popular Repositories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-orange-500/50 transition-colors cursor-pointer group" onClick={(e) => { /* SAFETY: wrapper */ handleSearch(e as any, "cursor/plugins"); }}>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors">cursor/plugins</h3>
                  <p className="text-xs text-zinc-500 mt-1">Official Cursor community skills repository.</p>
                </div>
                <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-orange-500/50 transition-colors cursor-pointer group" onClick={(e) => { /* SAFETY: wrapper */ handleSearch(e as any, "vercel-labs/skills"); }}>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors">vercel-labs/skills</h3>
                  <p className="text-xs text-zinc-500 mt-1">Foundational skills and examples from Vercel.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.items.length > 0 && state.repoInfo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-zinc-500 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center gap-2 font-mono text-xs">
                <FolderOpen className="w-4 h-4" />
                <span>{state.repoInfo.owner} / {state.repoInfo.repo} {state.repoInfo.path ? `/ ${state.repoInfo.path}` : ""}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleBack} className="h-7 text-xs px-2">
                &larr; Back to Discover
              </Button>
            </div>
            
            <div className="flex flex-col gap-3">
              {state.items.map((item) => {
                const isInstalled = installedSkills.some(s => s.packageName === `${state.repoInfo!.owner}/${state.repoInfo!.repo}` && s.slug === item.name);
                const isInstalling = state.installingItem === item.name;

                return (
                  <div key={item.path} className="flex items-center p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:border-orange-500/30 transition-all duration-200">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate" title={item.name}>
                          {item.name}
                        </h3>
                        <a href={item.html_url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-orange-500 transition-colors">
                          <ArrowSquareOut className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {item.description || "No description available. Click install to fetch and add this skill to your workspace."}
                      </p>
                    </div>
                    
                    <div className="shrink-0">
                      <Button
                        variant={isInstalled ? "secondary" : "default"}
                        size="sm"
                        className="w-24 text-xs h-8"
                        disabled={isInstalled || isInstalling}
                        onClick={() => handleInstall(item)}
                      >
                        {isInstalling ? (
                          "Installing..."
                        ) : isInstalled ? (
                          <span className="flex items-center justify-center gap-1"><CheckCircle weight="fill" className="text-emerald-500" /> Installed</span>
                        ) : (
                          <span className="flex items-center justify-center gap-1"><DownloadSimple /> Install</span>
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
