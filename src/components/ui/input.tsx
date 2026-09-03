import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../../tokens.stylex.ts";

const styles = stylex.create({
  input: {
    display: "flex",
    height: 34,
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgPrimary,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
    fontSize: 12,
    color: colors.textPrimary,
    boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "150ms",
    "::placeholder": {
      color: colors.textMuted,
    },
    ":focus": {
      outline: "none",
      borderColor: colors.primary,
      boxShadow: "0 0 0 1px var(--color-orange-500), inset 0 1px 1px rgba(0, 0, 0, 0.08)",
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
    "::-webkit-file-upload-button": {
      borderWidth: 0,
      borderStyle: "none",
      backgroundColor: "transparent",
      fontSize: 12,
      fontWeight: 500,
    },
  },
});

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const sx = stylex.props(styles.input);
    return (
      <input
        type={type}
        ref={ref}
        {...props}
        {...sx}
        className={className ? `${sx.className} ${className}` : sx.className}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
