import { parse as parseYaml } from "npm:yaml@2.7.0";
import { AgentId, Skill, SkillMetadata } from "../types/skills.ts";

export function parseSkillMd(
  content: string,
  _filePath?: string
): { metadata: SkillMetadata; body: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  let metadata: SkillMetadata = {
    name: "Unnamed Skill",
    description: "",
  };
  let body = content;

  if (match) {
    try {
      const parsed = parseYaml(match[1]) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        metadata = {
          name: String(parsed.name || "Unnamed Skill"),
          description: String(parsed.description || ""),
          author: parsed.author ? String(parsed.author) : undefined,
          version: parsed.version ? String(parsed.version) : undefined,
          trigger: parsed.trigger
            ? String(parsed.trigger)
            : `/${String(parsed.name || "skill").toLowerCase()}`,
          tools: Array.isArray(parsed.tools) ? parsed.tools.map(String) : [],
          agents: Array.isArray(parsed.agents)
            ? parsed.agents.map((a) => String(a) as AgentId)
            : [],
          license: parsed.license ? String(parsed.license) : undefined,
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
          const { metadata, body } = parseSkillMd(content, skillMdPath);
          const stat = await Deno.lstat(skillDir);

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
