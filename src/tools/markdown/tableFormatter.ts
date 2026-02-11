/**
 * Markdown table formatting utilities
 * Reformats tables for human readability with dynamic column widths
 */

interface TableCell {
  content: string;
  alignment?: "left" | "center" | "right";
}

interface ParsedTable {
  startLine: number;
  endLine: number;
  headers: TableCell[];
  alignments: ("left" | "center" | "right")[];
  rows: TableCell[][];
}

/**
 * Check if a line is a table row (starts and ends with |, or contains | separators)
 */
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  // Must contain at least one pipe and have content
  if (!trimmed.includes("|")) {
    return false;
  }
  // Common table patterns: |...|...| or ...|...|...
  return /^\|?.+\|.+\|?$/.test(trimmed);
}

/**
 * Check if a line is a separator row (contains only |, -, :, and whitespace)
 */
function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|") || !trimmed.includes("-")) {
    return false;
  }
  // Separator rows contain only |, -, :, and whitespace
  return /^[\s|:-]+$/.test(trimmed);
}

/**
 * Parse alignment from separator cell
 */
function parseAlignment(cell: string): "left" | "center" | "right" {
  const trimmed = cell.trim();
  const leftColon = trimmed.startsWith(":");
  const rightColon = trimmed.endsWith(":");

  if (leftColon && rightColon) {
    return "center";
  }
  if (rightColon) {
    return "right";
  }
  return "left";
}

/**
 * Parse a table row into cells
 */
function parseRow(line: string): string[] {
  // Remove leading/trailing pipes and split
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith("|")) {
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed.split("|").map((cell) => cell.trim());
}

/**
 * Find and parse all tables in the markdown content
 */
function findTables(lines: string[]): ParsedTable[] {
  const tables: ParsedTable[] = [];
  let i = 0;

  while (i < lines.length) {
    // Look for potential table start (a row followed by a separator)
    if (isTableRow(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const startLine = i;
      const headerCells = parseRow(lines[i]);
      const separatorCells = parseRow(lines[i + 1]);

      // Parse alignments from separator row
      const alignments = separatorCells.map((cell) => parseAlignment(cell));

      // Collect data rows
      const rows: TableCell[][] = [];
      i += 2; // Move past header and separator

      while (i < lines.length && isTableRow(lines[i]) && !isSeparatorRow(lines[i])) {
        const rowCells = parseRow(lines[i]);
        rows.push(rowCells.map((content) => ({ content })));
        i++;
      }

      tables.push({
        startLine,
        endLine: i - 1,
        headers: headerCells.map((content) => ({ content })),
        alignments,
        rows,
      });
    } else {
      i++;
    }
  }

  return tables;
}

/**
 * Calculate the maximum width needed for each column
 */
function calculateColumnWidths(table: ParsedTable): number[] {
  const columnCount = Math.max(
    table.headers.length,
    table.alignments.length,
    ...table.rows.map((row) => row.length)
  );

  const widths: number[] = new Array(columnCount).fill(3); // Minimum width of 3 for separator

  // Check header widths
  table.headers.forEach((cell, i) => {
    widths[i] = Math.max(widths[i], cell.content.length);
  });

  // Check row widths
  table.rows.forEach((row) => {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i], cell.content.length);
    });
  });

  return widths;
}

/**
 * Pad a cell to the specified width with alignment
 */
function padCell(content: string, width: number, alignment: "left" | "center" | "right"): string {
  const padding = width - content.length;
  if (padding <= 0) {
    return content;
  }

  switch (alignment) {
    case "center": {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return " ".repeat(leftPad) + content + " ".repeat(rightPad);
    }
    case "right":
      return " ".repeat(padding) + content;
    case "left":
    default:
      return content + " ".repeat(padding);
  }
}

/**
 * Generate a separator cell with alignment markers
 */
function generateSeparatorCell(width: number, alignment: "left" | "center" | "right"): string {
  const dashWidth = width;
  const dashes = "-".repeat(dashWidth);

  switch (alignment) {
    case "center":
      return ":" + "-".repeat(Math.max(1, dashWidth - 2)) + ":";
    case "right":
      return "-".repeat(Math.max(1, dashWidth - 1)) + ":";
    case "left":
    default:
      return dashes;
  }
}

/**
 * Format a single table with aligned columns
 */
function formatTable(table: ParsedTable): string[] {
  const widths = calculateColumnWidths(table);
  const lines: string[] = [];

  // Ensure we have alignments for all columns
  const alignments = widths.map((_, i) => table.alignments[i] || "left");

  // Format header row
  const headerCells = widths.map((width, i) => {
    const content = table.headers[i]?.content || "";
    return padCell(content, width, alignments[i]);
  });
  lines.push("| " + headerCells.join(" | ") + " |");

  // Format separator row
  const separatorCells = widths.map((width, i) => generateSeparatorCell(width, alignments[i]));
  lines.push("| " + separatorCells.join(" | ") + " |");

  // Format data rows
  table.rows.forEach((row) => {
    const rowCells = widths.map((width, i) => {
      const content = row[i]?.content || "";
      return padCell(content, width, alignments[i]);
    });
    lines.push("| " + rowCells.join(" | ") + " |");
  });

  return lines;
}

/**
 * Format all tables in markdown content
 * @param markdown The markdown content to format
 * @returns Formatted markdown with aligned tables
 */
export function formatTables(markdown: string): string {
  const lines = markdown.split("\n");
  const tables = findTables(lines);

  if (tables.length === 0) {
    return markdown;
  }

  // Process tables in reverse order to preserve line numbers
  const result = [...lines];
  for (let i = tables.length - 1; i >= 0; i--) {
    const table = tables[i];
    const formattedLines = formatTable(table);

    // Replace original table lines with formatted ones
    result.splice(table.startLine, table.endLine - table.startLine + 1, ...formattedLines);
  }

  return result.join("\n");
}
