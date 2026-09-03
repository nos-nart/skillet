import React from "react";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  root: {
    position: "relative" as const,
    overflow: "hidden",
    width: "100%",
    height: "100%",
  },
  viewport: {
    width: "100%",
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    borderRadius: "inherit",
    "::-webkit-scrollbar": {
      width: 6,
      height: 6,
    },
    "::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(120, 120, 120, 0.25)",
      borderRadius: 3,
    },
    "::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "rgba(120, 120, 120, 0.45)",
    },
  },
});

interface ScrollAreaProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  contentStyle?: React.CSSProperties;
}

export function ScrollArea({ children, style, className, contentStyle }: ScrollAreaProps) {
  const rootProps = stylex.props(styles.root);
  return (
    <div
      {...rootProps}
      className={className ? `${rootProps.className} ${className}` : rootProps.className}
      style={{ ...rootProps.style, ...style }}
    >
      <div {...stylex.props(styles.viewport)}>
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}
