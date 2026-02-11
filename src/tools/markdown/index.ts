import { Parser } from "extended-markdown-adf-parser";
import type { ADFDocument, ToolDefinition } from "../../types.js";

// Initialize the parser
const parser = new Parser();

/**
 * Tool definitions for the markdown collection
 */
export const markdownTools: ToolDefinition[] = [
  {
    name: "markdown_adf_to_markdown",
    description:
      "Convert Atlassian Document Format (ADF) to Extended Markdown. ADF is used by Atlassian products like Jira and Confluence. Supports all ADF elements including panels, tables, media, mentions, and more.",
    inputSchema: {
      type: "object",
      properties: {
        adf: {
          type: "object",
          description:
            "The ADF document to convert. Must be a valid ADF JSON object with type 'doc' and version 1.",
        },
      },
      required: ["adf"],
    },
  },
  {
    name: "markdown_markdown_to_adf",
    description:
      "Convert Extended Markdown to Atlassian Document Format (ADF). Supports standard markdown plus ADF extensions like panels, expands, media placeholders, mentions, and status indicators.",
    inputSchema: {
      type: "object",
      properties: {
        markdown: {
          type: "string",
          description: "The markdown text to convert to ADF.",
        },
      },
      required: ["markdown"],
    },
  },
];

/**
 * Convert ADF to Markdown
 */
export function adfToMarkdown(adf: ADFDocument): string {
  try {
    const markdown = parser.adfToMarkdown(adf);
    return markdown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert ADF to Markdown: ${message}`);
  }
}

/**
 * Convert Markdown to ADF
 */
export function markdownToAdf(markdown: string): ADFDocument {
  try {
    const adf = parser.markdownToAdf(markdown);
    return adf as ADFDocument;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert Markdown to ADF: ${message}`);
  }
}

/**
 * Handle markdown tool calls
 */
export function handleMarkdownTool(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "markdown_adf_to_markdown": {
      const adf = args.adf as ADFDocument;
      if (!adf) {
        throw new Error("adf parameter is required");
      }
      if (adf.type !== "doc") {
        throw new Error("Invalid ADF: root type must be 'doc'");
      }
      const result = adfToMarkdown(adf);
      return JSON.stringify({ success: true, markdown: result }, null, 2);
    }

    case "markdown_markdown_to_adf": {
      const markdown = args.markdown as string;
      if (!markdown) {
        throw new Error("markdown parameter is required");
      }
      const result = markdownToAdf(markdown);
      return JSON.stringify({ success: true, adf: result }, null, 2);
    }

    default:
      throw new Error(`Unknown markdown tool: ${name}`);
  }
}
