import React from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../../tokens.stylex.ts";

const styles = stylex.create({
  horizontal: {
    height: 1,
    width: "100%",
    flexShrink: 0,
    backgroundColor: colors.borderDefault,
    borderWidth: 0,
    borderStyle: "none",
    margin: 0,
    padding: 0,
  },
  vertical: {
    width: 1,
    height: "100%",
    flexShrink: 0,
    backgroundColor: colors.borderDefault,
    borderWidth: 0,
    borderStyle: "none",
    margin: 0,
    padding: 0,
  },
});

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export function Separator({ orientation = "horizontal", decorative = true }: SeparatorProps) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      {...stylex.props(orientation === "horizontal" ? styles.horizontal : styles.vertical)}
    />
  );
}
