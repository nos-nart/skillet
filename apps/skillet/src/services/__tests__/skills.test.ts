import { Effect } from "effect";
import {
  getSkills,
  isSkillEnabled,
  parseSkillMd,
  resolveSkillTarget,
  toggleSkill,
  listSkillsEffect,
  readSkillMdEffect,
  toggleSkillEffect,
  copySkillToWorkspaceEffect,
  SkillsFileSystem,
  LiveSkillsFileSystem,
  type SkillsFs,
} from "../skills";
import { FsError, InvalidSlugError } from "../errors";

test("parses frontmatter name", () => {
  const { metadata } = parseSkillMd("---\nname: eli5\n---\n\nBody");
  expect(metadata.name).toBe("eli5");
});

test("parses description and trims body", () => {
  const { metadata, body } = parseSkillMd(
    '---\nname: eli5\ndescription: "Explain simply"\n---\n\n\nBody here\n',
  );
  expect(metadata.description).toBe("Explain simply");
  expect(body).toBe("Body here");
});

test("falls back to Unnamed Skill without frontmatter", () => {
  const { metadata, body } = parseSkillMd("# Just markdown");
  expect(metadata.name).toBe("Unnamed Skill");
  expect(metadata.description).toBe("");
  expect(body).toBe("# Just markdown");
});

test("derives default trigger from name", () => {
  const { metadata } = parseSkillMd("---\nname: My Cool Skill\n---\n\nBody");
  expect(metadata.trigger).toBe("/my-cool-skill");
});

test("missing-name trigger falls back to /skill (scanner.ts parity)", () => {
  const { metadata } = parseSkillMd("---\ndescription: hi\n---\n\nBody");
  expect(metadata.name).toBe("Unnamed Skill");
  expect(metadata.trigger).toBe("/skill");
});

test("unparseable frontmatter leaves body as full content (scanner.ts parity)", () => {
  const input = "---\n::: not yaml :::\n---\nBody";
  const { metadata, body } = parseSkillMd(input);
  expect(metadata.name).toBe("Unnamed Skill");
  expect(body).toBe(input);
});

test("parses scalar fields and tool lists", () => {
  const { metadata } = parseSkillMd(
    "---\nname: x\nauthor: ada\nversion: 1.2.0\nlicense: MIT\nsource_url: https://github.com/o/r\ntools:\n  - Read\n  - Bash\nagents: [claude-code, cursor]\n---\n\nBody",
  );
  expect(metadata.author).toBe("ada");
  expect(metadata.version).toBe("1.2.0");
  expect(metadata.license).toBe("MIT");
  expect(metadata.sourceUrl).toBe("https://github.com/o/r");
  expect(metadata.tools).toEqual(["Read", "Bash"]);
  expect(metadata.agents).toEqual(["claude-code", "cursor"]);
});

function fakeFs(files: Record<string, string>): SkillsFs & {
  symlinked: Array<[string, string]>;
  unlinked: string[];
} {
  const symlinked: Array<[string, string]> = [];
  const unlinked: string[] = [];
  return {
    symlinked,
    unlinked,
    scanSkillsDir: async (dir: string) => {
      const prefix = dir.endsWith("/") ? dir : `${dir}/`;
      const kids = new Set<string>();
      for (const path of Object.keys(files)) {
        if (path.startsWith(prefix)) {
          const rest = path.slice(prefix.length);
          const head = rest.split("/")[0];
          if (head !== "") kids.add(prefix + head);
        }
      }
      if (kids.size === 0) throw new Error(`invalid_path: ${dir}`);
      return [...kids].sort();
    },
    readSkillMd: async (path: string) => {
      const content = files[path];
      if (content === undefined) throw new Error(`read_failed: ${path}`);
      return content;
    },
    symlink: async (source: string, target: string) => {
      symlinked.push([source, target]);
      return true;
    },
    unlink: async (target: string) => {
      unlinked.push(target);
      return true;
    },
  };
}

test("getSkills finds top-level and nested owner/slug skills", async () => {
  const fs = fakeFs({
    "~/.skills/eli5/SKILL.md": "---\nname: eli5\ndescription: Explain\n---\n\nBody",
    "~/.skills/acme/architect/SKILL.md": "---\nname: architect\n---\n\nBody",
  });
  const skills = await getSkills(["~/.skills"], fs);
  expect(skills.map((s) => s.slug).sort()).toEqual(["architect", "eli5"]);
  const nested = skills.find((s) => s.slug === "architect");
  expect(nested?.packageName).toBe("acme");
  expect(nested?.provider).toBe("github");
  expect(nested?.sourceUrl).toBe("https://github.com/acme");
  expect(nested?.scope).toBe("global");
  const top = skills.find((s) => s.slug === "eli5");
  expect(top?.packageName).toBe("Global skills");
  expect(top?.provider).toBe("local");
});

test("getSkills dedups by slug across agent dirs", async () => {
  const fs = fakeFs({
    "~/.skills/dup/SKILL.md": "---\nname: dup\n---\n\nA",
    "~/.cursor/skills/dup/SKILL.md": "---\nname: dup\n---\n\nB",
  });
  const skills = await getSkills(["~/.skills", "~/.cursor/skills"], fs);
  expect(skills.filter((s) => s.slug === "dup")).toHaveLength(1);
});

test("getSkills tolerates missing dirs", async () => {
  const skills = await getSkills(["~/.does-not-exist"], fakeFs({}));
  expect(skills).toEqual([]);
});

test("resolveSkillTarget guards traversal slugs", () => {
  expect(resolveSkillTarget("/ws/proj", "ok-slug_1.2")).toBe("/ws/proj/.skills/ok-slug_1.2");
  expect(resolveSkillTarget("/ws/proj/", "../evil")).toBeNull();
  expect(resolveSkillTarget("/ws/proj", "a/b")).toBeNull();
});

test("resolveSkillTarget rejects empty and tilde workspace paths", () => {
  expect(resolveSkillTarget("", "eli5")).toBeNull();
  expect(resolveSkillTarget("~/ws", "eli5")).toBeNull();
});

test("toggleSkill enables via symlink and disables via unlink", async () => {
  const fs = fakeFs({});
  const req = {
    skillSlug: "eli5",
    sourcePath: "/Users/x/.skills/eli5",
    workspacePath: "/ws/proj",
    enable: true,
  };
  await expect(toggleSkill(req, fs)).resolves.toBe(true);
  expect(fs.symlinked).toEqual([["/Users/x/.skills/eli5", "/ws/proj/.skills/eli5"]]);
  await expect(toggleSkill({ ...req, enable: false }, fs)).resolves.toBe(true);
  expect(fs.unlinked).toEqual(["/ws/proj/.skills/eli5"]);
});

test("toggleSkill rejects unsafe slugs without touching fs", async () => {
  const fs = fakeFs({});
  await expect(
    toggleSkill(
      {
        skillSlug: "..",
        sourcePath: "/src",
        workspacePath: "/ws",
        enable: true,
      },
      fs,
    ),
  ).resolves.toBe(false);
  expect(fs.symlinked).toEqual([]);
});

test("isSkillEnabled reflects workspace scan", async () => {
  const fs = fakeFs({ "/ws/proj/.skills/eli5/SKILL.md": "---\nname: eli5\n---\n" });
  await expect(isSkillEnabled("eli5", "/ws/proj", fs)).resolves.toBe(true);
  await expect(isSkillEnabled("missing", "/ws/proj", fs)).resolves.toBe(false);
  await expect(isSkillEnabled("..", "/ws/proj", fs)).resolves.toBe(false);
});

describe("SkillsFileSystem Effect Service", () => {
  test("listSkillsEffect retrieves skills through service layer", async () => {
    const fs = fakeFs({
      "~/.skills/test-skill/SKILL.md": "---\nname: test-skill\ndescription: test\n---\n\nContent",
    });

    const skills = await Effect.runPromise(listSkillsEffect(["~/.skills"], fs));
    expect(skills).toHaveLength(1);
    expect(skills[0].slug).toBe("test-skill");
  });

  test("toggleSkillEffect fails with InvalidSlugError on path traversal attempt", async () => {
    const fs = fakeFs({});
    const req = {
      skillSlug: "../evil",
      sourcePath: "/src",
      workspacePath: "/ws/proj",
      enable: true,
    };

    const err = await Effect.runPromise(toggleSkillEffect(req, fs).pipe(Effect.flip));
    expect(err).toBeInstanceOf(InvalidSlugError);
    expect((err as InvalidSlugError).slug).toBe("../evil");
  });

  test("readSkillMdEffect reads skill content or fails with FsError", async () => {
    const fs = fakeFs({
      "/path/to/SKILL.md": "content",
    });

    const content = await Effect.runPromise(readSkillMdEffect("/path/to/SKILL.md", fs));
    expect(content).toBe("content");

    const err = await Effect.runPromise(readSkillMdEffect("/nonexistent", fs).pipe(Effect.flip));
    expect(err).toBeInstanceOf(FsError);
  });

  test("copySkillToWorkspaceEffect safely copies SKILL.md", async () => {
    let writtenPath = "";
    let writtenContent = "";
    const writer = {
      ensureDir: async () => true,
      writeTextFile: async (p: string, c: string) => {
        writtenPath = p;
        writtenContent = c;
        return true;
      },
    };
    const fs = fakeFs({
      "/source/SKILL.md": "---\nname: my-skill\n---\nbody",
    });

    const ok = await Effect.runPromise(
      copySkillToWorkspaceEffect("my-skill", "/source", "/ws/proj", { fs, writer }),
    );
    expect(ok).toBe(true);
    expect(writtenPath).toBe("/ws/proj/.skills/my-skill/SKILL.md");
    expect(writtenContent).toBe("---\nname: my-skill\n---\nbody");
  });
});

