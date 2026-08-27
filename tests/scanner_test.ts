import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseSkillMd, scanDirectoryForSkills } from "../src/backend/scanner.ts";

Deno.test("parseSkillMd - extracts YAML frontmatter and markdown body", () => {
  const sampleMd = `---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance.
author: Jane Doe
version: 1.0.0
trigger: /web-design
tools:
  - view_file
  - search_web
agents:
  - cursor
  - claude-code
license: MIT
---

# Web Design Guidelines
Follow modern guidelines for layout and typography.
`;

  const parsed = parseSkillMd(sampleMd);
  assertEquals(parsed.metadata.name, "web-design-guidelines");
  assertEquals(parsed.metadata.description, "Review UI code for Web Interface Guidelines compliance.");
  assertEquals(parsed.metadata.author, "Jane Doe");
  assertEquals(parsed.metadata.version, "1.0.0");
  assertEquals(parsed.metadata.trigger, "/web-design");
  assertEquals(parsed.metadata.tools, ["view_file", "search_web"]);
  assertEquals(parsed.metadata.agents, ["cursor", "claude-code"]);
  assertEquals(parsed.metadata.license, "MIT");
  assertEquals(parsed.body, "# Web Design Guidelines\nFollow modern guidelines for layout and typography.");
});

Deno.test("parseSkillMd - generates default trigger when not provided", () => {
  const sampleMd = `---
name: SuperSkill
description: A super skill
---
# Content here
`;

  const parsed = parseSkillMd(sampleMd);
  assertEquals(parsed.metadata.name, "SuperSkill");
  assertEquals(parsed.metadata.trigger, "/superskill");
});

Deno.test("parseSkillMd - handles content without frontmatter", () => {
  const plainMd = `# Simple Document\nNo frontmatter here.`;
  const parsed = parseSkillMd(plainMd);
  assertEquals(parsed.metadata.name, "Unnamed Skill");
  assertEquals(parsed.metadata.description, "");
  assertEquals(parsed.body, plainMd);
});

Deno.test("parseSkillMd - handles malformed frontmatter gracefully", () => {
  const badYaml = `---
name: [unclosed list
---
# Content`;
  const parsed = parseSkillMd(badYaml);
  assertEquals(parsed.metadata.name, "Unnamed Skill");
  assertExists(parsed.body);
});

Deno.test("scanDirectoryForSkills - discovers valid SKILL.md in directories", async () => {
  const tempDir = await Deno.makeTempDir();
  const skill1Dir = `${tempDir}/my-skill-1`;
  const skill2Dir = `${tempDir}/my-skill-2`;
  const nonSkillDir = `${tempDir}/not-a-skill`;

  await Deno.mkdir(skill1Dir, { recursive: true });
  await Deno.writeTextFile(
    `${skill1Dir}/SKILL.md`,
    `---\nname: Skill One\ndescription: First test skill\n---\n# Content 1`
  );

  await Deno.mkdir(skill2Dir, { recursive: true });
  await Deno.writeTextFile(
    `${skill2Dir}/SKILL.md`,
    `---\nname: Skill Two\ndescription: Second test skill\n---\n# Content 2`
  );

  await Deno.mkdir(nonSkillDir, { recursive: true });
  await Deno.writeTextFile(`${nonSkillDir}/README.md`, "# Not a skill");

  const skills = await scanDirectoryForSkills(tempDir, "global", "cursor");
  assertEquals(skills.length, 2);

  const skill1 = skills.find((s) => s.slug === "my-skill-1");
  const skill2 = skills.find((s) => s.slug === "my-skill-2");

  assertExists(skill1);
  assertEquals(skill1.name, "Skill One");
  assertEquals(skill1.agent, "cursor");
  assertEquals(skill1.scope, "global");
  assertEquals(skill1.path, skill1Dir);
  assertEquals(skill1.skillMdPath, `${skill1Dir}/SKILL.md`);
  assertEquals(skill1.rawMarkdown, "# Content 1");
  assertEquals(skill1.isSymlink, false);

  assertExists(skill2);
  assertEquals(skill2.name, "Skill Two");

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("scanDirectoryForSkills - returns empty array for nonexistent directory", async () => {
  const skills = await scanDirectoryForSkills("/non/existent/path/for/sure", "global", "claude-code");
  assertEquals(skills, []);
});

Deno.test("scanDirectoryForSkills - detects symlinked skills", async () => {
  const tempDir = await Deno.makeTempDir();
  const targetDir = `${tempDir}/actual-skill`;
  const scanDir = `${tempDir}/agent-skills`;
  const symlinkDir = `${scanDir}/symlinked-skill`;

  await Deno.mkdir(targetDir, { recursive: true });
  await Deno.writeTextFile(
    `${targetDir}/SKILL.md`,
    `---\nname: Symlinked Skill\ndescription: Symlink test\n---\n# Symlink Content`
  );

  await Deno.mkdir(scanDir, { recursive: true });
  await Deno.symlink(targetDir, symlinkDir);

  const skills = await scanDirectoryForSkills(scanDir, "project", "antigravity");
  assertEquals(skills.length, 1);
  assertEquals(skills[0].name, "Symlinked Skill");
  assertEquals(skills[0].isSymlink, true);
  assertEquals(skills[0].agent, "antigravity");
  assertEquals(skills[0].scope, "project");

  await Deno.remove(tempDir, { recursive: true });
});
