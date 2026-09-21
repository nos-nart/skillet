import { SVG_DATA_URIS, AVATAR_FALLBACKS, SYMBOL_FALLBACKS } from "../agentLogos";

describe("agentLogos", () => {
  const agentIds = [
    "claude-code",
    "cursor",
    "gemini",
    "antigravity",
    "copilot",
    "windsurf",
    "opencode",
    "generic",
  ];

  test("provides valid base64 SVG data URIs for all agents in light and dark mode", () => {
    for (const id of agentIds) {
      const uris = SVG_DATA_URIS[id];
      expect(uris).toBeDefined();
      expect(uris.light).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(uris.dark).toMatch(/^data:image\/svg\+xml;base64,/);

      // Verify base64 string decodes to valid SVG XML
      const lightSvg = Buffer.from(uris.light.replace("data:image/svg+xml;base64,", ""), "base64").toString("utf8");
      expect(lightSvg).toContain("<svg");
      expect(lightSvg).toContain("</svg>");

      const darkSvg = Buffer.from(uris.dark.replace("data:image/svg+xml;base64,", ""), "base64").toString("utf8");
      expect(darkSvg).toContain("<svg");
      expect(darkSvg).toContain("</svg>");
    }
  });

  test("provides fallback avatar URLs for third-party agents", () => {
    expect(AVATAR_FALLBACKS["claude-code"]).toContain("anthropics.png");
    expect(AVATAR_FALLBACKS["cursor"]).toContain("getcursor.png");
    expect(AVATAR_FALLBACKS["gemini"]).toContain("google.png");
    expect(AVATAR_FALLBACKS["antigravity"]).toContain("google.png");
    expect(AVATAR_FALLBACKS["copilot"]).toContain("github.png");
    expect(AVATAR_FALLBACKS["windsurf"]).toContain("codeium.png");
    expect(AVATAR_FALLBACKS["opencode"]).toContain("opencode-ai.png");
  });

  test("provides SF Symbol fallbacks for all agents", () => {
    for (const id of agentIds) {
      expect(SYMBOL_FALLBACKS[id]).toBeDefined();
      expect(typeof SYMBOL_FALLBACKS[id]).toBe("string");
    }
  });
});
