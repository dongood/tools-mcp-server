/**
 * Atlassian Document Format (ADF) document structure
 */
export interface ADFDocument {
  type: "doc";
  version: 1;
  content: ADFNode[];
}

/**
 * Generic ADF node structure
 */
export interface ADFNode {
  type: string;
  content?: ADFNode[];
  text?: string;
  marks?: ADFMark[];
  attrs?: Record<string, unknown>;
}

/**
 * ADF mark for text formatting
 */
export interface ADFMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Tool definition for MCP server
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * Result of markdown conversion operations
 */
export interface MarkdownConversionResult {
  success: boolean;
  data?: string | ADFDocument;
  error?: string;
}
