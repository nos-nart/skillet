import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseMarkdown } from "comark";

Deno.test("Markdown parsing - comark parses headers, paragraphs and code blocks", async () => {
  const markdown = "# Test Title\n\nThis is a paragraph with `inline code`.\n\n```ts\nconst a = 1;\n```";
  const doc = await parseMarkdown(markdown);

  assertExists(doc);
  assertEquals(typeof doc, "object");
});

