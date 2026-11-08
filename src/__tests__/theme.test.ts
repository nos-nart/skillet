import * as fs from "fs";
import * as path from "path";
import { DARK_PALETTE, LIGHT_PALETTE } from "../services/theme";
import { skilletColors } from "../theme";

function extractVariantTokens(css: string, variant: "light" | "dark"): Record<string, string> {
  const re = new RegExp(`@variant\\s+${variant}\\s*\\{([\\s\\S]*?)\\}`, "m");
  const match = re.exec(css);
  if (!match) return {};
  const tokens: Record<string, string> = {};
  const propRe = /(--color-[a-z-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(match[1])) !== null) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

test("dark bg token exists", () => {
  expect(skilletColors.bgPrimaryDark).toBe(DARK_PALETTE.background);
});

test("primary brand tokens match Apple Blue", () => {
  expect(skilletColors.primaryLight).toBe("#007AFF");
  expect(skilletColors.primaryDark).toBe("#0A84FF");
});

test("theme.ts palettes stay in 1:1 sync with global.css", () => {
  const cssPath = path.resolve(__dirname, "../../global.css");
  const css = fs.readFileSync(cssPath, "utf8");
  const light = extractVariantTokens(css, "light");
  const dark = extractVariantTokens(css, "dark");

  expect(LIGHT_PALETTE.background).toBe(light["--color-background"]);
  expect(LIGHT_PALETTE.foreground).toBe(light["--color-foreground"]);
  expect(LIGHT_PALETTE.muted).toBe(light["--color-muted"]);
  expect(LIGHT_PALETTE.surface).toBe(light["--color-surface"]);
  expect(LIGHT_PALETTE.surfaceMuted).toBe(light["--color-surface-muted"]);
  expect(LIGHT_PALETTE.border).toBe(light["--color-border"]);
  expect(LIGHT_PALETTE.primary).toBe(light["--color-primary"]);
  expect(LIGHT_PALETTE.danger).toBe(light["--color-danger"]);

  expect(DARK_PALETTE.background).toBe(dark["--color-background"]);
  expect(DARK_PALETTE.foreground).toBe(dark["--color-foreground"]);
  expect(DARK_PALETTE.muted).toBe(dark["--color-muted"]);
  expect(DARK_PALETTE.surface).toBe(dark["--color-surface"]);
  expect(DARK_PALETTE.surfaceMuted).toBe(dark["--color-surface-muted"]);
  expect(DARK_PALETTE.border).toBe(dark["--color-border"]);
  expect(DARK_PALETTE.primary).toBe(dark["--color-primary"]);
  expect(DARK_PALETTE.danger).toBe(dark["--color-danger"]);
});
