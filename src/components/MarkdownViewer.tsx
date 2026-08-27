import React, { useState, useEffect } from "react";
import { parseMarkdown, type MarkdownDocument as MarkdownDocType } from "comark";
import { MarkdownDocument } from "@comark/react";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const [doc, setDoc] = useState<MarkdownDocType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!content) {
      setDoc(null);
      setError(null);
      return;
    }

    parseMarkdown(content)
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
      <div className="text-xs text-red-400 p-4 bg-red-950/30 rounded border border-red-800/50">
        <p className="font-semibold mb-1">Failed to parse markdown:</p>
        <pre className="text-[11px] font-mono whitespace-pre-wrap">{content}</pre>
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-xs max-w-none text-zinc-300 prose-headings:text-zinc-100 prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-code:text-orange-300 prose-code:bg-zinc-800/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-md prose-pre:p-3 prose-p:leading-relaxed">
      {doc ? (
        <MarkdownDocument value={doc} />
      ) : (
        <p className="text-zinc-500 italic text-xs">Loading documentation...</p>
      )}
    </div>
  );
}
