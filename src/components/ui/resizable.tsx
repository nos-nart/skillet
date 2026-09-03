import React from "react";
import * as stylex from "@stylexjs/stylex";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import { colors, iconSizes } from "../../tokens.stylex.ts";

const styles = stylex.create({
  group: {
    display: "flex",
    width: "100%",
    height: "100%",
  },
  groupVertical: {
    flexDirection: "column",
  },
  handle: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.borderDefault,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    outline: "none",
    ":hover": {
      backgroundColor: colors.primary,
    },
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${colors.primary}`,
    },
  },
  handleColumnDivider: {
    width: 1,
    height: "100%",
    flexShrink: 0,
  },
  handleRowDivider: {
    width: "100%",
    height: 1,
    flexShrink: 0,
  },
  grip: {
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 12,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
  },
});

export function ResizablePanelGroup({
  direction = "horizontal",
  ...props
}: React.ComponentProps<typeof PanelGroup>) {
  return (
    <PanelGroup
      direction={direction}
      {...stylex.props(styles.group, direction === "vertical" && styles.groupVertical)}
      {...props}
    />
  );
}

export function ResizablePanel(props: React.ComponentProps<typeof Panel>) {
  return <Panel {...props} />;
}

export function ResizableHandle({
  withHandle,
  direction = "horizontal",
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean;
  direction?: "horizontal" | "vertical";
}) {
  return (
    <PanelResizeHandle
      {...stylex.props(
        styles.handle,
        direction === "horizontal" ? styles.handleColumnDivider : styles.handleRowDivider,
      )}
      {...props}
    >
      {withHandle && (
        <div {...stylex.props(styles.grip)}>
          <DotsSixVerticalIcon weight="light" style={{ ...iconSizes.xs, color: colors.textMuted }} />
        </div>
      )}
    </PanelResizeHandle>
  );
}
