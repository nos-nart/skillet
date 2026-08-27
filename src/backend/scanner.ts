import { parse as parseYaml } from "npm:yaml@2.7.0";
import { AgentId, Skill, SkillMetadata } from "../types/skills.ts";

interface RawSkillFrontmatter {
  name?: string;
  description?: string;
  author?: string;
  version?: string;
  trigger?: string;
  tools?: unknown[];
  agents?: unknown[];
  license?: string;
  source_url?: string;
}

export interface ParsedSkillDoc {
  metadata: SkillMetadata;
  body: string;
}

function isFrontmatterObject(val: any): val is RawSkillFrontmatter {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

export function parseSkillMd(content: string): ParsedSkillDoc {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  let metadata: SkillMetadata = {
    name: "Unnamed Skill",
    description: "",
  };
  let body = content;

  if (match) {
    try {
      // SAFETY: parseYaml returns raw object matching frontmatter shape when valid
      const parsed = parseYaml(match[1]);
      if (isFrontmatterObject(parsed)) {
        metadata = {
          name: String(parsed.name || "Unnamed Skill"),
          description: String(parsed.description || ""),
          author: parsed.author ? String(parsed.author) : undefined,
          version: parsed.version ? String(parsed.version) : undefined,
          trigger: parsed.trigger
            ? String(parsed.trigger)
            : `/${String(parsed.name || "skill").toLowerCase().replace(/\s+/g, "-")}`,
          tools: Array.isArray(parsed.tools) ? parsed.tools.map(String) : [],
          agents: Array.isArray(parsed.agents)
            ? parsed.agents.map((a) => {
                // SAFETY: Downcasting validated string entries to AgentId domain type
                return String(a) as AgentId;
              })
            : [],
          license: parsed.license ? String(parsed.license) : undefined,
          sourceUrl: parsed.source_url ? String(parsed.source_url) : undefined,
        };
        body = match[2].trim();
      }
    } catch {
      // Fallback if frontmatter fails to parse
    }
  }

  return { metadata, body };
}

export async function scanDirectoryForSkills(
  dirPath: string,
  scope: "global" | "project",
  agent: AgentId
): Promise<Skill[]> {
  const skills: Skill[] = [];

  async function walk(currentDir: string, relativeDir: string, depth: number) {
    if (depth > 3) return; // Prevent infinite loops or scanning too deep
    try {
      for await (const entry of Deno.readDir(currentDir)) {
        if (entry.name.startsWith(".")) continue; // Skip hidden dirs
        if (entry.isDirectory || entry.isSymlink) {
          const nextDir = `${currentDir}/${entry.name}`;
          const nextRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
          const skillMdPath = `${nextDir}/SKILL.md`;
          try {
            const content = await Deno.readTextFile(skillMdPath);
            const { metadata, body } = parseSkillMd(content);
            const stat = await Deno.lstat(nextDir);
            
            // For GitHub installed skills, the relativeDir might be owner/slug or owner/repo/slug
            const parts = nextRelative.split("/");
            const isGithub = parts.length > 1 || (metadata.sourceUrl?.includes("github.com") ?? false);
            const packageName = parts.length > 1 ? parts[0] + (parts.length > 2 ? `/${parts[1]}` : "") : "Global skills";
            const slug = parts[parts.length - 1];

            skills.push({
              id: nextRelative,
              name: metadata.name,
              slug: slug,
              packageName,
              scope,
              agent,
              path: nextDir,
              skillMdPath,
              metadata,
              rawMarkdown: body,
              isSymlink: stat.isSymlink,
              provider: isGithub ? "github" : "local",
              sourceUrl: metadata.sourceUrl || (parts.length > 1 ? `https://github.com/${parts[0]}` : undefined),
            });
          } catch {
            // No SKILL.md here, recurse deeper
            await walk(nextDir, nextRelative, depth + 1);
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  await walk(dirPath, "", 0);
  return skills;
}
