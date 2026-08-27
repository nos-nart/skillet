import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parse as parseMarkdown } from "npm:marked@15.0.7";

Deno.test("Markdown parsing - renders headers, paragraphs and code blocks", () => {
  const markdown = "# Test Title\n\nThis is a paragraph with `inline code`.\n\n```ts\nconst a = 1;\n```";
  const html = parseMarkdown(markdown) as string;

  assertStringIncludes(html, "<h1");
  assertStringIncludes(html, "Test Title");
  assertStringIncludes(html, "<code>inline code</code>");
  assertStringIncludes(html, "<pre><code");
});
