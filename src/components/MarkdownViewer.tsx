import React, { useState, useEffect, useRef } from "react";
import { parseMarkdown, type MarkdownDocument as MarkdownDocType } from "comark";
import shiki from "comark/plugins/shiki";
import { MarkdownDocument } from "@comark/react";
import { Copy, Check } from "@phosphor-icons/react";
import { cn } from "../lib/utils.ts";

interface MarkdownViewerProps {
  content: string;
}

function CodeBlockWrapper(props: React.HTMLAttributes<HTMLPreElement> & { language?: string }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const { className, style, language, ...rest } = props;

  const handleCopy = () => {
    if (preRef.current) {
      const text = preRef.current.innerText || "";
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="code-block my-5 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800/90 bg-zinc-100/80 dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4.5 py-2 bg-zinc-200/60 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
        <span className="tracking-wider font-semibold uppercase text-[10.5px] text-zinc-500 dark:text-zinc-400">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all duration-150 active:scale-95 cursor-pointer px-2.5 py-1 rounded-md hover:bg-zinc-300/50 dark:hover:bg-zinc-800"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check weight="bold" className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in-75 duration-150" />
              <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy weight="light" className="w-3.5 h-3.5" />
              <span className="font-sans font-medium">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-inner p-5 overflow-x-auto">
        <pre
          ref={preRef}
          className={cn("text-[12px] font-mono text-zinc-900 dark:text-zinc-100 leading-[1.7] font-normal block", className)}
          style={style}
          {...rest}
        />
      </div>
    </div>
  );
}

const customComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-2.5"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-4 mb-2"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-3 mb-1.5"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3.5"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc list-outside ml-4 text-sm text-zinc-700 dark:text-zinc-300 space-y-1.5 mb-3.5"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal list-outside ml-4 text-sm text-zinc-700 dark:text-zinc-300 space-y-1.5 mb-3.5"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed pl-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-2 border-orange-500/80 bg-orange-500/5 dark:bg-orange-500/10 pl-3.5 py-1.5 my-3.5 text-xs italic text-zinc-700 dark:text-zinc-300 rounded-r-lg"
      {...props}
    />
  ),
  pre: CodeBlockWrapper,
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    return (
      <code
        className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/90 text-orange-600 dark:text-orange-300 border border-zinc-300 dark:border-zinc-700/50"
        {...props}
      />
    );
  },
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      target="_blank"
      rel="noreferrer"
      className="text-orange-600 dark:text-orange-400 underline hover:text-orange-500 transition-colors"
      {...props}
    />
  ),
  hr: () => <hr className="my-5 border-zinc-200 dark:border-zinc-800" />,
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
        <pre className="text-xs font-mono whitespace-pre-wrap">{content}</pre>
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
