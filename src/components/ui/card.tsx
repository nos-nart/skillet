import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../../tokens.stylex.ts";

const styles = stylex.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    padding: 16,
    paddingBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "-0.01em",
    color: colors.textPrimary,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    padding: 16,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    padding: 16,
    paddingTop: 0,
  },
});

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const sx = stylex.props(styles.card);
  return (
    <div
      ref={ref}
      {...props}
      {...sx}
      className={className ? `${sx.className} ${className}` : sx.className}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const sx = stylex.props(styles.header);
  return (
    <div
      ref={ref}
      {...props}
      {...sx}
      style={{ ...sx.style, ...style }}
      className={className ? `${sx.className} ${className}` : sx.className}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, style, ...props }, ref) => {
  const sx = stylex.props(styles.title);
  return (
    <h3
      ref={ref}
      {...props}
      {...sx}
      style={{ ...sx.style, ...style }}
      className={className ? `${sx.className} ${className}` : sx.className}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, style, ...props }, ref) => {
  const sx = stylex.props(styles.description);
  return (
    <p
      ref={ref}
      {...props}
      {...sx}
      style={{ ...sx.style, ...style }}
      className={className ? `${sx.className} ${className}` : sx.className}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const sx = stylex.props(styles.content);
  return (
    <div
      ref={ref}
      {...props}
      {...sx}
      style={{ ...sx.style, ...style }}
      className={className ? `${sx.className} ${className}` : sx.className}
    />
  );
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const sx = stylex.props(styles.footer);
  return (
    <div
      ref={ref}
      {...props}
      {...sx}
      style={{ ...sx.style, ...style }}
      className={className ? `${sx.className} ${className}` : sx.className}
    />
  );
});
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
