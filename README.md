# Tools MCP Server

An MCP (Model Context Protocol) server that exposes a collection of utility tools for AI agents. This modular server allows agents to perform complex operations through well-defined tool interfaces.

## Features

### Markdown Collection

- **ADF to Markdown**: Convert Atlassian Document Format (ADF) to Extended Markdown
- **Markdown to ADF**: Convert Extended Markdown to Atlassian Document Format

Supports all ADF elements including panels, tables, media, mentions, code blocks, and more.

## Installation

```bash
npm install
npm run build
```

## Claude Desktop Setup

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "toolkit": {
      "command": "node",
      "args": ["/absolute/path/to/tools-mcp-server/build/index.js"]
    }
  }
}
```

**Important**: Use absolute paths, not relative paths.

After updating the configuration, fully quit Claude Desktop (Cmd+Q on macOS) and reopen it.

## Claude Code Setup

### Global Configuration (recommended)

Edit `~/.claude.json` and add the server under the `mcpServers` key. This makes the server available in all projects without per-project approval prompts:

```json
{
  "mcpServers": {
    "toolkit": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/tools-mcp-server/build/index.js"]
    }
  }
}
```

### Project Configuration

Alternatively, add a `.mcp.json` file to your project root for project-specific access:

```json
{
  "mcpServers": {
    "toolkit": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/tools-mcp-server/build/index.js"]
    }
  }
}
```

After adding the config, restart Claude Code (`exit` then `claude`).

## Available Tools

### Markdown Collection

| Tool | Description | Parameters |
| ---- | ----------- | ---------- |
| `markdown_adf_to_markdown` | Convert ADF JSON to Extended Markdown | `adf` (ADF document object) |
| `markdown_markdown_to_adf` | Convert Extended Markdown to ADF JSON | `markdown` (string) |

## Usage Examples

Once configured, you can ask Claude:

- "Convert this Confluence ADF to markdown"
- "Transform this markdown into ADF format for Jira"
- "Parse this ADF document and give me the markdown equivalent"

### Example: ADF to Markdown

```json
{
  "name": "markdown_adf_to_markdown",
  "arguments": {
    "adf": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            { "type": "text", "text": "Hello " },
            { "type": "text", "text": "World", "marks": [{ "type": "strong" }] }
          ]
        }
      ]
    }
  }
}
```

Returns: `Hello **World**`

### Example: Markdown to ADF

```json
{
  "name": "markdown_markdown_to_adf",
  "arguments": {
    "markdown": "# Heading\n\nThis is a **bold** statement."
  }
}
```

Returns a complete ADF document structure.

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the server (for testing)
npm start

# Format code
npm run format

# Lint code
npm run lint
```

## Adding New Tool Collections

1. Create a new folder under `src/tools/` (e.g., `src/tools/json/`)
2. Define your tools array and handler function following the markdown pattern
3. Export `tools` array and `handleTool` function
4. Import and register in `src/index.ts`

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## License

MIT
