import React, { useState, useEffect } from "react";
import { parseMarkdown, type MarkdownDocument as MarkdownDocType } from "comark";
import shiki from "comark/plugins/shiki";
import { MarkdownDocument } from "@comark/react";

interface MarkdownViewerProps {
  content: string;
}

const customComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-2.5 pb-1.5 border-b border-zinc-200 dark:border-zinc-800"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-3 mb-1.5"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-2.5 mb-1"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc list-outside ml-4 text-xs text-zinc-700 dark:text-zinc-300 space-y-1 mb-3"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal list-outside ml-4 text-xs text-zinc-700 dark:text-zinc-300 space-y-1 mb-3"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed pl-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-2 border-orange-500/80 bg-orange-500/5 dark:bg-orange-500/10 pl-3 py-1.5 my-3 text-xs italic text-zinc-700 dark:text-zinc-300 rounded-r"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement> & { language?: string }) => {
    return (
      <div className="code-block my-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/90 shadow-sm">
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-200/80 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
          <span>{props.language || "code"}</span>
        </div>
        <pre className="p-3 text-xs font-mono overflow-x-auto text-zinc-800 dark:text-zinc-200 leading-normal" {...props} />
      </div>
    );
  },
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    return (
      <code
        className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800/90 text-orange-600 dark:text-orange-300 border border-zinc-300 dark:border-zinc-700/50"
        {...props}
      />
    );
  },
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      target="_blank"
      rel="noreferrer"
      className="text-orange-600 dark:text-orange-400 underline hover:text-orange-500"
      {...props}
    />
  ),
  hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-800" />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props} />
  ),
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const [doc, setDoc] = useState<MarkdownDocType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!content || !content.trim()) {
      setDoc(null);
      setError(null);
      return;
    }

    parseMarkdown(content, { plugins: [shiki()] })
      .then((parsed) => {
        if (!cancelled) {
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
      <div className="text-xs text-red-500 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        <p className="font-semibold mb-1">Markdown Render Error:</p>
        <pre className="text-[11px] font-mono whitespace-pre-wrap">{content}</pre>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-4 text-xs text-zinc-500 italic">
        Loading documentation...
      </div>
    );
  }

  return (
    <div className="markdown-content text-zinc-800 dark:text-zinc-200 select-text">
      <MarkdownDocument value={doc} components={customComponents} />
    </div>
  );
}
