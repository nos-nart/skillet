import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { GearSixIcon, SunIcon, MoonIcon } from "@phosphor-icons/react";
import { Card, CardContent } from "../ui/card.tsx";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import { useTheme } from "../../hooks/useTheme.ts";
import { colors, iconSizes } from "../../tokens.stylex.ts";

const styles = stylex.create({
  main: {
    width: "100%",
    height: "100%",
    padding: 32,
    backgroundColor: colors.bgPrimary,
    overflowY: "auto",
  },
  container: {
    maxWidth: 640,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.textPrimary,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  themeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  runtime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export function SettingsTab() {
  const [token, setToken] = useState(localStorage.getItem("github_token") || "");
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSaveToken = () => {
    localStorage.setItem("github_token", token.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main {...stylex.props(styles.main)}>
      <div {...stylex.props(styles.container)}>
        <div>
          <h2 {...stylex.props(styles.title)}>
            <GearSixIcon weight="light" style={{ ...iconSizes.xl, color: colors.textSecondary }} />
            Settings & Preferences
          </h2>
          <p {...stylex.props(styles.desc)}>
            Configure GitHub API tokens, discovery directories, and runtime preferences.
          </p>
        </div>

        <div {...stylex.props(styles.section)}>
          <Card>
            <CardContent style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <label {...stylex.props(styles.label)}>GitHub Personal Access Token (Optional)</label>
              <p {...stylex.props(styles.hint)}>Used to increase rate limits when discovering remote skills and checking for updates.</p>
              <div {...stylex.props(styles.inputRow)}>
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  style={{ fontFamily: "monospace", flex: 1 }}
                />
                <Button size="sm" onClick={handleSaveToken}>
                  {saved ? "Saved!" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <label {...stylex.props(styles.label)}>Theme Appearance</label>
              <p {...stylex.props(styles.hint)}>Choose your preferred interface theme.</p>
              <div {...stylex.props(styles.themeRow)}>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <MoonIcon weight="light" style={iconSizes.md} />
                  <span>Dark Mode</span>
                </Button>
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <SunIcon weight="light" style={iconSizes.md} />
                  <span>Light Mode</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <label {...stylex.props(styles.label)}>Application Runtime</label>
              <p {...stylex.props(styles.runtime)}>
                Skillet v1.0.0 (Deno Desktop Runtime · Vite 8 · Rolldown · Space Grotesk · comark · Shiki · Phosphor Icons)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
