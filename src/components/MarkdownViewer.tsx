import React, { useMemo } from "react";
import { parse as parseMarkdown } from "npm:marked@15.0.7";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const html = useMemo(() => {
    try {
      return parseMarkdown(content) as string;
    } catch {
      return `<p class="text-red-400">Failed to render markdown</p>`;
    }
  }, [content]);

  return (
    <div
      className="prose prose-invert prose-xs max-w-none text-zinc-300 prose-headings:text-zinc-100 prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-code:text-orange-300 prose-code:bg-zinc-800/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-md prose-pre:p-3 prose-p:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
