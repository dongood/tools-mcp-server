# Tools MCP Server - Agent Instructions

## Project Overview

This is an MCP (Model Context Protocol) server that exposes a collection of utility tools for AI agents. The server is built with TypeScript and follows a modular architecture where tools are organized into collections.

## Code Quality Requirements

**All code changes must pass formatting and linting before being considered complete.**

```bash
npm run format      # Format code with Prettier
npm run lint        # Check for ESLint errors
npm run type-check  # Verify TypeScript types
npm run build       # Compile TypeScript
```

See `.claude/instructions/typescript-coding-standards.md` for detailed coding standards.

## Project Structure

```
tools-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── types.ts              # Shared TypeScript interfaces
│   └── tools/
│       └── <collection>/     # Tool collections (e.g., markdown/)
│           └── index.ts      # Tools and handler for collection
├── spec/
│   └── features/             # Product specifications
│       └── <collection>/     # Feature docs per collection
├── build/                    # Compiled JavaScript (git-ignored)
├── .claude/
│   └── instructions/         # Coding standards and guidelines
├── package.json
├── tsconfig.json
├── eslint.config.js
└── .prettierrc.json
```

## Adding New Tools

### 1. Create a New Collection

```bash
mkdir -p src/tools/<collection-name>
```

### 2. Implement the Collection

Create `src/tools/<collection-name>/index.ts`:

```typescript
import type { ToolDefinition } from "../../types.js";

export const myTools: ToolDefinition[] = [
  {
    name: "<collection>_<action>",
    description: "Description of what the tool does",
    inputSchema: {
      type: "object",
      properties: {
        // define parameters
      },
      required: ["requiredParam"],
    },
  },
];

export function handleMyTool(
  name: string,
  args: Record<string, unknown>
): string {
  // Handle tool calls
}
```

### 3. Register in Main Server

Update `src/index.ts`:

```typescript
import { myTools, handleMyTool } from "./tools/<collection>/index.js";

// Add to allTools array
const allTools = [...markdownTools, ...myTools];

// Add routing in CallToolRequestSchema handler
if (name.startsWith("<collection>_")) {
  const result = handleMyTool(name, args as Record<string, unknown>);
  return { content: [{ type: "text", text: result }] };
}
```

### 4. Document the Feature

Create `spec/features/<collection>/<feature>.md` with:
- Overview of the feature
- Tool descriptions and schemas
- Example inputs/outputs
- Supported elements or options

## Tool Naming Convention

Tools follow the pattern: `<collection>_<action>`

Examples:
- `markdown_adf_to_markdown`
- `markdown_markdown_to_adf`
- `json_validate`
- `json_format`

## Development Workflow

1. **Make changes** to TypeScript source files
2. **Format code**: `npm run format`
3. **Lint code**: `npm run lint`
4. **Type check**: `npm run type-check`
5. **Build**: `npm run build`
6. **Test**: Run server with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Error Handling Pattern

Tools should return structured responses:

**Success:**
```json
{
  "success": true,
  "data": "result here"
}
```

**Error (thrown):**
```typescript
throw new Error("Descriptive error message");
```

The server wraps errors in the standard MCP error response format.

## Current Tool Collections

### Markdown Collection (`markdown_*`)

Bidirectional conversion between Atlassian Document Format (ADF) and Extended Markdown.

- `markdown_adf_to_markdown` - Convert ADF to Markdown
- `markdown_markdown_to_adf` - Convert Markdown to ADF

See `spec/features/markdown/adf-conversion.md` for details.
