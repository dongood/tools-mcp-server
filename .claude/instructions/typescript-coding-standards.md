# TypeScript Coding Standards

## Overview

This document defines the TypeScript coding standards for the Tools MCP Server project. All TypeScript code must adhere to these standards to ensure consistency, maintainability, and code quality.

## Core Principles

1. **Type Safety First**: Leverage TypeScript's type system fully; avoid `any` unless absolutely necessary
2. **Explicit Over Implicit**: Always specify return types and parameter types
3. **Consistency**: Follow established patterns throughout the codebase
4. **Readability**: Write self-documenting code with clear naming and structure
5. **Testability**: Design code to be easily unit tested

## Code Formatting

### Prettier Configuration

**All TypeScript files must be formatted using Prettier** before committing.

Run formatting:
```bash
npm run format        # Format all files
npm run format:check  # Check formatting without changes
```

**Configuration** (`.prettierrc.json`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## ESLint Requirements

**No ESLint errors or warnings allowed.**

Run linting:
```bash
npm run lint      # Check for errors
npm run lint:fix  # Auto-fix where possible
```

Required rules enforced:
- `@typescript-eslint/explicit-function-return-type`: error
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-unused-vars`: error
- `no-console`: error (except `console.error`)
- `eqeqeq`: always use `===` and `!==`
- `curly`: always use braces

## TypeScript Configuration

### Strict Mode Required

The project uses strict TypeScript configuration:
- `strict: true`
- ES2020 target and module system
- ES Module imports only (no CommonJS)

### Type Annotations

#### Always Specify Return Types

```typescript
// Good: Explicit return type
function add(a: number, b: number): number {
  return a + b;
}

async function fetchData(id: string): Promise<Data> {
  return api.get<Data>(`/data/${id}`);
}

// Bad: Missing return types
function add(a: number, b: number) {
  return a + b;
}
```

#### Avoid `any` Type

```typescript
// Bad
function processData(data: any): any {
  return data.value;
}

// Good: Use proper types or unknown
function processData(data: unknown): string {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error("Invalid data");
}
```

## Naming Conventions

### Files and Directories

- **Files**: `kebab-case.ts`
- **Test files**: `kebab-case.test.ts` (alongside implementation)
- **Directories**: `kebab-case`

### Code Elements

| Element | Convention | Example |
| ------- | ---------- | ------- |
| Variables | `camelCase` | `userName` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Functions | `camelCase` | `getUserById` |
| Classes | `PascalCase` | `UserService` |
| Interfaces | `PascalCase` (no `I` prefix) | `UserConfig` |
| Types | `PascalCase` | `RequestParams` |

## Error Handling

### Use Typed Errors

```typescript
// Good: Typed error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`Operation failed: ${message}`);
}
```

### Never Swallow Errors Silently

```typescript
// Bad: Silent failure
try {
  await operation();
} catch {
  // nothing
}

// Good: Log or rethrow
try {
  await operation();
} catch (error) {
  console.error("Operation failed:", error);
  throw error;
}
```

## Module Organization

### Export Patterns

```typescript
// Prefer named exports
export function doSomething(): void { ... }
export interface Config { ... }

// Group related exports
export { toolA, toolB, handleTool } from "./tools.js";
```

### Import Order

1. Node.js built-ins
2. External packages
3. Internal modules (absolute paths)
4. Relative imports
5. Type-only imports

```typescript
import { readFile } from "node:fs/promises";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { markdownTools } from "./tools/markdown/index.js";

import type { ToolDefinition } from "./types.js";
```

## Pre-commit Requirements

All code must pass these checks before commit:

1. **Prettier**: `npm run format:check`
2. **ESLint**: `npm run lint` (zero errors/warnings)
3. **TypeScript**: `npm run type-check`
4. **Build**: `npm run build`

## Tool Implementation Pattern

When adding new tools, follow this structure:

```typescript
// src/tools/<collection>/index.ts

import type { ToolDefinition } from "../../types.js";

// 1. Define tool metadata
export const myTools: ToolDefinition[] = [
  {
    name: "collection_tool_name",
    description: "Clear description of what the tool does",
    inputSchema: {
      type: "object",
      properties: {
        param: { type: "string", description: "Parameter description" },
      },
      required: ["param"],
    },
  },
];

// 2. Implement tool logic
function doTool(param: string): string {
  // implementation
  return result;
}

// 3. Handle tool dispatch
export function handleMyTool(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case "collection_tool_name": {
      const param = args.param as string;
      if (!param) {
        throw new Error("param is required");
      }
      return JSON.stringify({ success: true, result: doTool(param) }, null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```
