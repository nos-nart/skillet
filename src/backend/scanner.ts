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
  try {
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isDirectory || entry.isSymlink) {
        const skillDir = `${dirPath}/${entry.name}`;
        const skillMdPath = `${skillDir}/SKILL.md`;
        try {
          const content = await Deno.readTextFile(skillMdPath);
          const { metadata, body } = parseSkillMd(content);
          const stat = await Deno.lstat(skillDir);
          const isGithub = entry.name.includes("/") || (metadata.sourceUrl?.includes("github.com") ?? false);

          skills.push({
            id: `${entry.name}`,
            name: metadata.name,
            slug: entry.name,
            packageName: entry.name.includes("/")
              ? entry.name.split("/")[0]
              : "Global skills",
            scope,
            agent,
            path: skillDir,
            skillMdPath,
            metadata,
            rawMarkdown: body,
            isSymlink: stat.isSymlink,
            provider: isGithub ? "github" : "local",
            sourceUrl: metadata.sourceUrl || (entry.name.includes("/") ? `https://github.com/${entry.name}` : undefined),
          });
        } catch {
          // No SKILL.md in this directory or read error, skip
        }
      }
    }
  } catch {
    // Directory does not exist or unreadable, return empty array
  }
  return skills;
}
