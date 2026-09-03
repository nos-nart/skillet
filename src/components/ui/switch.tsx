import React from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, duration, easings } from "../../tokens.stylex.ts";

const styles = stylex.create({
  root: {
    position: "relative" as const,
    display: "inline-flex",
    alignItems: "center",
    width: 36,
    height: 20,
    flexShrink: 0,
    cursor: "pointer",
    isolation: "isolate",
  },
  input: {
    position: "absolute",
    margin: 0,
    padding: 0,
    opacity: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
    zIndex: 1,
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  track: {
    display: "flex",
    alignItems: "center",
    width: 36,
    height: 20,
    padding: 2,
    borderRadius: "9999px",
    boxSizing: "border-box" as const,
    transitionProperty: "background-color",
    transitionDuration: duration.fast,
    transitionTimingFunction: easings.standard,
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  trackOff: {
    backgroundColor: colors.textMuted,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: "9999px",
    backgroundColor: colors.textInverse,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
    transitionProperty: "transform",
    transitionDuration: duration.fast,
    transitionTimingFunction: easings.standard,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    pointerEvents: "none" as const,
  },
  thumbOn: {
    transform: "translateX(16px)",
  },
  thumbOff: {
    transform: "translateX(0px)",
  },
});

interface SwitchProps extends Omit<React.ComponentProps<"label">, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, disabled, ...props }: SwitchProps) {
  return (
    <label {...stylex.props(styles.root)} {...props}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        {...stylex.props(styles.input)}
      />
      <div {...stylex.props(styles.track, checked ? styles.trackOn : styles.trackOff)}>
        <div {...stylex.props(styles.thumb, checked ? styles.thumbOn : styles.thumbOff)} />
      </div>
    </label>
  );
}
