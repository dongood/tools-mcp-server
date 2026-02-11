import { Parser } from "extended-markdown-adf-parser";
import type { ADFDocument, ToolDefinition } from "../../types.js";
import { formatTables } from "./tableFormatter.js";
import { refreshTOC, generateTOCFromMarkdown, insertTOC, processTOC } from "./tocRefresh.js";

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
  {
    name: "markdown_format_tables",
    description:
      "Format markdown tables for human readability. Calculates optimal column widths based on content and aligns all cells. Preserves column alignment markers (left, center, right).",
    inputSchema: {
      type: "object",
      properties: {
        markdown: {
          type: "string",
          description: "The markdown content containing tables to format.",
        },
      },
      required: ["markdown"],
    },
  },
  {
    name: "markdown_refresh_toc",
    description:
      "Refresh an existing table of contents (TOC) in markdown to match current headings. Detects TOC by pattern (- [text](#anchor)), regenerates anchors, and updates indentation. Returns unchanged if no TOC exists.",
    inputSchema: {
      type: "object",
      properties: {
        markdown: {
          type: "string",
          description: "The markdown content with a TOC to refresh.",
        },
        minLevel: {
          type: "number",
          description:
            "Minimum heading level to include (1-6). Defaults to auto-detect from document.",
        },
        maxLevel: {
          type: "number",
          description: "Maximum heading level to include (1-6). Defaults to 6.",
        },
      },
      required: ["markdown"],
    },
  },
  {
    name: "markdown_generate_toc",
    description:
      "Generate a table of contents from markdown headings. Returns TOC lines without inserting them. Use this to create a new TOC for a document that doesn't have one.",
    inputSchema: {
      type: "object",
      properties: {
        markdown: {
          type: "string",
          description: "The markdown content to generate TOC from.",
        },
        minLevel: {
          type: "number",
          description:
            "Minimum heading level to include (1-6). Defaults to auto-detect from document.",
        },
        maxLevel: {
          type: "number",
          description: "Maximum heading level to include (1-6). Defaults to 6.",
        },
      },
      required: ["markdown"],
    },
  },
  {
    name: "markdown_insert_toc",
    description:
      "Replace /toc markers in markdown with generated table of contents. Finds lines containing only '/toc' and replaces them with a TOC based on document headings.",
    inputSchema: {
      type: "object",
      properties: {
        markdown: {
          type: "string",
          description: "The markdown content with /toc markers to replace.",
        },
        minLevel: {
          type: "number",
          description:
            "Minimum heading level to include (1-6). Defaults to auto-detect from document.",
        },
        maxLevel: {
          type: "number",
          description: "Maximum heading level to include (1-6). Defaults to 6.",
        },
      },
      required: ["markdown"],
    },
  },
  {
    name: "markdown_format",
    description:
      "Format markdown for human readability. Combines table formatting, /toc marker replacement, and TOC refresh in one operation. Use options to control which formatting is applied.",
    inputSchema: {
      type: "object",
      properties: {
        markdown: {
          type: "string",
          description: "The markdown content to format.",
        },
        formatTables: {
          type: "boolean",
          description: "Whether to format tables. Defaults to true.",
        },
        processTOC: {
          type: "boolean",
          description:
            "Whether to process TOC (replace /toc markers and refresh existing TOC). Defaults to true.",
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

    case "markdown_format_tables": {
      const markdown = args.markdown as string;
      if (!markdown) {
        throw new Error("markdown parameter is required");
      }
      const result = formatTables(markdown);
      return JSON.stringify({ success: true, markdown: result }, null, 2);
    }

    case "markdown_refresh_toc": {
      const markdown = args.markdown as string;
      if (!markdown) {
        throw new Error("markdown parameter is required");
      }
      const options = {
        minLevel: args.minLevel as number | undefined,
        maxLevel: args.maxLevel as number | undefined,
      };
      const result = refreshTOC(markdown, options);
      return JSON.stringify({ success: true, markdown: result }, null, 2);
    }

    case "markdown_generate_toc": {
      const markdown = args.markdown as string;
      if (!markdown) {
        throw new Error("markdown parameter is required");
      }
      const options = {
        minLevel: args.minLevel as number | undefined,
        maxLevel: args.maxLevel as number | undefined,
      };
      const tocLines = generateTOCFromMarkdown(markdown, options);
      return JSON.stringify({ success: true, toc: tocLines.join("\n") }, null, 2);
    }

    case "markdown_insert_toc": {
      const markdown = args.markdown as string;
      if (!markdown) {
        throw new Error("markdown parameter is required");
      }
      const options = {
        minLevel: args.minLevel as number | undefined,
        maxLevel: args.maxLevel as number | undefined,
      };
      const result = insertTOC(markdown, options);
      return JSON.stringify({ success: true, markdown: result }, null, 2);
    }

    case "markdown_format": {
      const markdown = args.markdown as string;
      if (!markdown) {
        throw new Error("markdown parameter is required");
      }
      const shouldFormatTables = args.formatTables !== false;
      const shouldProcessTOC = args.processTOC !== false;

      let result = markdown;
      if (shouldFormatTables) {
        result = formatTables(result);
      }
      if (shouldProcessTOC) {
        result = processTOC(result);
      }
      return JSON.stringify({ success: true, markdown: result }, null, 2);
    }

    default:
      throw new Error(`Unknown markdown tool: ${name}`);
  }
}
