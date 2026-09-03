import React, { useState, useEffect, useRef, useCallback } from "react";
import { parseMarkdown, type MarkdownDocument as MarkdownDocType } from "comark";
import shiki from "comark/plugins/shiki";
import { MarkdownDocument } from "@comark/react";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import * as stylex from "@stylexjs/stylex";
import { colors, iconSizes } from "../tokens.stylex.ts";

const shikiPlugin = shiki();
const docCache = new Map<string, MarkdownDocType>();

interface MarkdownViewerProps {
  content: string;
}

const s = stylex.create({
  codeBlock: {
    margin: "12px 0",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
  },
  codeHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: colors.bgTertiary,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderDefault,
    fontSize: 10.5,
    fontFamily: "monospace",
    fontWeight: 500,
    color: colors.textSecondary,
  },
  codeLang: {
    letterSpacing: "0.05em",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    fontSize: 10,
    color: colors.textMuted,
  },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10.5,
    color: colors.textMuted,
    transitionProperty: "color",
    transitionDuration: "150ms",
    cursor: "pointer",
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    ":hover": {
      color: colors.textPrimary,
      backgroundColor: colors.bgHover,
    },
    ":active": {
      transform: "scale(0.95)",
    },
  },
  pre: {
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 8,
    paddingBottom: 8,
    overflowX: "auto",
  },
  preInner: {
    fontSize: 13,
    fontFamily: "monospace",
    color: colors.textPrimary,
    lineHeight: 1.6,
    fontWeight: 400,
    display: "block",
    margin: 0,
    backgroundColor: "transparent",
  },
  h1: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderDefault,
  },
  h2: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  h3: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  h4: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  p: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 1.65,
    marginBottom: 14,
  },
  ul: {
    listStyleType: "disc",
    listStylePosition: "outside",
    marginLeft: 16,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  ol: {
    listStyleType: "decimal",
    listStylePosition: "outside",
    marginLeft: 16,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  li: {
    lineHeight: 1.65,
    paddingLeft: 4,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    borderLeftColor: colors.primary,
    backgroundColor: "color-mix(in srgb, var(--color-orange-500) 6%, transparent)",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    margin: "16px 0",
    fontSize: 13,
    lineHeight: 1.65,
    color: colors.textSecondary,
    borderRadius: 0,
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: 8,
  },
  table: {
    width: "100%",
    textAlign: "left",
    fontSize: 14,
    color: colors.textSecondary,
    borderCollapse: "collapse" as const,
  },
  thead: {
    backgroundColor: colors.bgTertiary,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderDefault,
  },
  th: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  td: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.borderDefault,
    verticalAlign: "top",
  },
  tr: {
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    ":hover": {
      backgroundColor: colors.bgHover,
    },
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: 13,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 6,
    backgroundColor: colors.bgTertiary,
    color: colors.primaryHover,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
  },
  link: {
    color: colors.primaryHover,
    textDecoration: "underline",
    transitionProperty: "color",
    transitionDuration: "150ms",
    ":hover": {
      color: colors.primary,
    },
  },
  hr: {
    margin: "20px 0",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.borderDefault,
    borderLeftWidth: 0,
    borderLeftStyle: "none",
    borderRightWidth: 0,
    borderRightStyle: "none",
    borderBottomWidth: 0,
    borderBottomStyle: "none",
  },
  strong: {
    fontWeight: 600,
    color: colors.textPrimary,
  },
  errorBox: {
    padding: 16,
    fontSize: 12,
    color: colors.destructive,
    backgroundColor: colors.destructiveSoft,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.destructiveBorder,
  },
  errorTitle: {
    fontWeight: 600,
    marginBottom: 4,
  },
  errorPre: {
    fontSize: 12,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap" as const,
  },
  loading: {
    padding: 16,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  markdownRoot: {
    color: colors.textPrimary,
    userSelect: "text" as const,
  },
});

function CodeBlockWrapper(props: React.HTMLAttributes<HTMLPreElement> & { language?: string }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { className, style, language, ...rest } = props;

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleCopy = useCallback(() => {
    if (preRef.current) {
      navigator.clipboard.writeText(preRef.current.innerText || "");
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div {...stylex.props(s.codeBlock)}>
      <div {...stylex.props(s.codeHeader)}>
        <span {...stylex.props(s.codeLang)}>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          {...stylex.props(s.copyBtn)}
          title="Copy code"
        >
          {copied ? (
            <>
              <CheckIcon weight="bold" style={{ ...iconSizes.sm, color: colors.success }} />
              <span style={{ color: colors.successHover, fontWeight: 500 }}>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon weight="light" style={iconSizes.sm} />
              <span style={{ fontWeight: 500 }}>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-inner" style={{ overflowX: "auto" }}>
        <pre
          ref={preRef}
          className={className}
          style={style}
          {...rest}
        />
      </div>
    </div>
  );
}

const customComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...stylex.props(s.h1)} {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...stylex.props(s.h2)} {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...stylex.props(s.h3)} {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 {...stylex.props(s.h4)} {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...stylex.props(s.p)} {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...stylex.props(s.ul)} {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...stylex.props(s.ol)} {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...stylex.props(s.li)} {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote {...stylex.props(s.blockquote)} {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div {...stylex.props(s.tableWrapper)}>
      <table {...stylex.props(s.table)} {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...stylex.props(s.thead)} {...props} />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th {...stylex.props(s.th)} {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td {...stylex.props(s.td)} {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr {...stylex.props(s.tr)} {...props} />
  ),
  pre: CodeBlockWrapper,
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    return (
      <code {...stylex.props(s.inlineCode)} {...props} />
    );
  },
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      target="_blank"
      rel="noreferrer"
      {...stylex.props(s.link)}
      {...props}
    />
  ),
  hr: () => <hr {...stylex.props(s.hr)} />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong {...stylex.props(s.strong)} {...props} />
  ),
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const [doc, setDoc] = useState<MarkdownDocType | null>(() => {
    if (!content) return null;
    return docCache.get(content) || null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!content || !content.trim()) {
      setDoc(null);
      setError(null);
      return;
    }

    const cached = docCache.get(content);
    if (cached) {
      setDoc(cached);
      setError(null);
      return;
    }

    parseMarkdown(content, { plugins: [shikiPlugin] })
      .then((parsed) => {
        if (!cancelled) {
          docCache.set(content, parsed);
          setDoc(parsed);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content]);

  if (error) {
    return (
      <div {...stylex.props(s.errorBox)}>
        <p {...stylex.props(s.errorTitle)}>Markdown Render Error:</p>
        <pre {...stylex.props(s.errorPre)}>{content}</pre>
      </div>
    );
  }

  if (!doc) {
    return (
      <div {...stylex.props(s.loading)}>
        Loading documentation...
      </div>
    );
  }

  return (
    <div {...stylex.props(s.markdownRoot)}>
      <MarkdownDocument value={doc} components={customComponents} />
    </div>
  );
}
