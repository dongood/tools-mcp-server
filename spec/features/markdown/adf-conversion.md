# Markdown Collection - ADF Conversion

## Overview

The markdown collection provides bidirectional conversion between Atlassian Document Format (ADF) and Extended Markdown. ADF is the JSON-based document format used by Atlassian products like Jira and Confluence.

## Tools

### markdown_adf_to_markdown

Converts an Atlassian Document Format (ADF) document to Extended Markdown.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "adf": {
      "type": "object",
      "description": "The ADF document to convert. Must be a valid ADF JSON object with type 'doc' and version 1."
    }
  },
  "required": ["adf"]
}
```

**Behavior:**
- Accepts a valid ADF document object
- Returns markdown string preserving all formatting and structure
- Supports all ADF node types (see Supported Elements below)
- Preserves ADF-specific attributes through metadata annotations

**Example:**
```json
// Input
{
  "adf": {
    "type": "doc",
    "version": 1,
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 1 },
        "content": [{ "type": "text", "text": "Hello World" }]
      }
    ]
  }
}

// Output
{
  "success": true,
  "markdown": "# Hello World"
}
```

### markdown_markdown_to_adf

Converts Extended Markdown text to Atlassian Document Format (ADF).

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "markdown": {
      "type": "string",
      "description": "The markdown text to convert to ADF."
    }
  },
  "required": ["markdown"]
}
```

**Behavior:**
- Accepts standard markdown plus ADF extensions
- Returns a complete ADF document structure
- Supports extended markdown syntax for ADF-specific elements

**Example:**
```json
// Input
{
  "markdown": "# Hello World\n\nThis is **bold** text."
}

// Output
{
  "success": true,
  "adf": {
    "type": "doc",
    "version": 1,
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 1 },
        "content": [{ "type": "text", "text": "Hello World" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "This is " },
          { "type": "text", "text": "bold", "marks": [{ "type": "strong" }] },
          { "type": "text", "text": " text." }
        ]
      }
    ]
  }
}
```

## Supported Elements

| Category | Element | ADF Node | Description |
| -------- | ------- | -------- | ----------- |
| **Document** | Document | `doc` | Root container |
| **Document** | Paragraph | `paragraph` | Text paragraphs |
| **Document** | Hard Break | `hardBreak` | Line breaks |
| **Headings** | H1-H6 | `heading` | All heading levels |
| **Formatting** | Bold | `mark:strong` | Bold text |
| **Formatting** | Italic | `mark:em` | Italic text |
| **Formatting** | Code | `mark:code` | Inline code |
| **Formatting** | Strikethrough | `mark:strike` | Crossed out text |
| **Formatting** | Underline | `mark:underline` | Underlined text |
| **Formatting** | Link | `mark:link` | Hyperlinks |
| **Formatting** | Text Color | `mark:textColor` | Custom colors |
| **Lists** | Bullet List | `bulletList` | Unordered lists |
| **Lists** | Ordered List | `orderedList` | Numbered lists |
| **Tables** | Table | `table` | Complete tables |
| **Tables** | Header/Cell | `tableHeader/tableCell` | Table cells |
| **Blocks** | Blockquote | `blockquote` | Quote blocks |
| **Blocks** | Code Block | `codeBlock` | Fenced code |
| **Blocks** | Horizontal Rule | `rule` | Dividers |
| **Panels** | Info/Warning/Error/Success/Note | `panel` | ADF panels |
| **Media** | Media | `media` | Media items |
| **Media** | Media Single/Group | `mediaSingle/mediaGroup` | Media containers |
| **Interactive** | Expand | `expand` | Collapsible sections |
| **Interactive** | Inline Card | `inlineCard` | Link previews |
| **Social** | Mention | `mention` | User mentions |
| **Social** | Emoji | `emoji` | Emoji characters |
| **Social** | Date | `date` | Date stamps |
| **Social** | Status | `status` | Status indicators |

## Error Handling

Both tools return structured error responses when conversion fails:

```json
{
  "content": [{ "type": "text", "text": "Error: <error message>" }],
  "isError": true
}
```

Common errors:
- Invalid ADF structure (missing `type: "doc"`)
- Malformed markdown syntax
- Unsupported node types

## Dependencies

This feature uses the `extended-markdown-adf-parser` package (v2.4.0+) which provides:
- Full bidirectional conversion fidelity
- Extended markdown syntax for ADF-specific elements
- TypeScript support with complete type definitions
- Zero runtime dependencies
