import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseMarkdown } from "comark";
import shiki from "comark/plugins/shiki";

Deno.test("Markdown parsing - comark with Shiki parses headers and code blocks", async () => {
  const markdown = "# Test Title\n\nThis is a paragraph with `inline code`.\n\n```ts\nconst a = 1;\n```";
  const doc = await parseMarkdown(markdown, { plugins: [shiki()] });

  assertExists(doc);
  assertEquals(typeof doc, "object");
  assertExists(doc.nodes);
});
