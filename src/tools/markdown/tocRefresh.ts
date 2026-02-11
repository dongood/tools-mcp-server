/**
 * Table of Contents (TOC) refresh utilities
 * Detects, generates, and updates TOC in markdown documents
 */

interface Heading {
  level: number;
  text: string;
  anchor: string;
  lineNumber: number;
}

interface TOCRange {
  startLine: number;
  endLine: number;
}

/**
 * Create an anchor from heading text (GitHub-style)
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters (keep only word chars and hyphens)
 */
function createAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/**
 * Parse all headings from markdown content
 */
function parseHeadings(lines: string[]): Heading[] {
  const headings: Heading[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/;

  // Track anchors to handle duplicates
  const anchorCounts = new Map<string, number>();

  lines.forEach((line, lineNumber) => {
    const match = line.match(headingRegex);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      let anchor = createAnchor(text);

      // Handle duplicate anchors by appending numbers
      const count = anchorCounts.get(anchor) || 0;
      if (count > 0) {
        anchor = `${anchor}-${count}`;
      }
      anchorCounts.set(anchor.replace(/-\d+$/, ""), count + 1);

      headings.push({ level, text, anchor, lineNumber });
    }
  });

  return headings;
}

/**
 * Check if a line is a TOC entry
 * Pattern: - [text](#anchor) with optional leading whitespace
 */
function isTOCEntry(line: string): boolean {
  return /^\s*-\s+\[.+\]\(#.+\)$/.test(line);
}

/**
 * Find the range of an existing TOC in the document
 * Returns null if no TOC is found
 */
function findTOCRange(lines: string[]): TOCRange | null {
  let startLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (isTOCEntry(lines[i])) {
      if (startLine === -1) {
        startLine = i;
      }
    } else if (startLine !== -1) {
      // Found end of TOC (non-TOC line after TOC started)
      // But allow empty lines within TOC
      if (lines[i].trim() === "") {
        // Check if there are more TOC entries after this empty line
        let hasMoreTOC = false;
        for (let j = i + 1; j < lines.length; j++) {
          if (isTOCEntry(lines[j])) {
            hasMoreTOC = true;
            break;
          } else if (lines[j].trim() !== "") {
            break;
          }
        }
        if (!hasMoreTOC) {
          return { startLine, endLine: i - 1 };
        }
      } else {
        return { startLine, endLine: i - 1 };
      }
    }
  }

  // TOC extends to end of document
  if (startLine !== -1) {
    // Find the last actual TOC entry (not trailing empty lines)
    let endLine = lines.length - 1;
    while (endLine > startLine && !isTOCEntry(lines[endLine])) {
      endLine--;
    }
    return { startLine, endLine };
  }

  return null;
}

/**
 * Generate TOC content from headings
 * @param headings Array of parsed headings
 * @param minLevel Minimum heading level to include (default: auto-detect)
 * @param maxLevel Maximum heading level to include (default: 6)
 */
function generateTOC(headings: Heading[], minLevel?: number, maxLevel: number = 6): string[] {
  if (headings.length === 0) {
    return [];
  }

  // Auto-detect minimum level if not specified
  const actualMinLevel = minLevel ?? Math.min(...headings.map((h) => h.level));

  // Filter headings by level range
  const filteredHeadings = headings.filter((h) => h.level >= actualMinLevel && h.level <= maxLevel);

  // Generate TOC lines with relative indentation
  return filteredHeadings.map((heading) => {
    const indent = "  ".repeat(heading.level - actualMinLevel);
    return `${indent}- [${heading.text}](#${heading.anchor})`;
  });
}

/**
 * Refresh the table of contents in markdown content
 * If no TOC exists, returns the original content unchanged
 * @param markdown The markdown content
 * @param options Options for TOC generation
 * @returns Markdown with refreshed TOC
 */
export function refreshTOC(
  markdown: string,
  options: { minLevel?: number; maxLevel?: number } = {}
): string {
  const lines = markdown.split("\n");
  const tocRange = findTOCRange(lines);

  if (!tocRange) {
    // No existing TOC found, return unchanged
    return markdown;
  }

  // Parse headings (excluding lines within the current TOC)
  const headings = parseHeadings(lines).filter(
    (h) => h.lineNumber < tocRange.startLine || h.lineNumber > tocRange.endLine
  );

  // Generate new TOC
  const newTOC = generateTOC(headings, options.minLevel, options.maxLevel);

  if (newTOC.length === 0) {
    // No headings found, remove TOC
    const result = [...lines];
    result.splice(tocRange.startLine, tocRange.endLine - tocRange.startLine + 1);
    return result.join("\n");
  }

  // Replace old TOC with new one
  const result = [...lines];
  result.splice(tocRange.startLine, tocRange.endLine - tocRange.startLine + 1, ...newTOC);

  return result.join("\n");
}

/**
 * Generate a new TOC from markdown content
 * Does not insert it, just returns the generated TOC
 * @param markdown The markdown content
 * @param options Options for TOC generation
 * @returns Array of TOC lines
 */
export function generateTOCFromMarkdown(
  markdown: string,
  options: { minLevel?: number; maxLevel?: number } = {}
): string[] {
  const lines = markdown.split("\n");
  const headings = parseHeadings(lines);
  return generateTOC(headings, options.minLevel, options.maxLevel);
}

/**
 * Check if an existing TOC is up to date
 * @param markdown The markdown content
 * @returns true if TOC matches current headings, false otherwise
 */
export function isTOCUpToDate(markdown: string): boolean {
  const lines = markdown.split("\n");
  const tocRange = findTOCRange(lines);

  if (!tocRange) {
    // No TOC exists
    return true;
  }

  // Get current TOC content
  const currentTOC = lines
    .slice(tocRange.startLine, tocRange.endLine + 1)
    .join("\n")
    .trim();

  // Parse headings (excluding TOC lines)
  const headings = parseHeadings(lines).filter(
    (h) => h.lineNumber < tocRange.startLine || h.lineNumber > tocRange.endLine
  );

  // Generate expected TOC
  const expectedTOC = generateTOC(headings).join("\n").trim();

  return currentTOC === expectedTOC;
}

/**
 * Check if a line is a /toc marker
 */
function isTOCMarker(line: string): boolean {
  return /^\s*\/toc\s*$/i.test(line);
}

/**
 * Find /toc markers in the document
 * @returns Array of line numbers where /toc markers are found
 */
function findTOCMarkers(lines: string[]): number[] {
  const markers: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isTOCMarker(lines[i])) {
      markers.push(i);
    }
  }
  return markers;
}

/**
 * Insert TOC at /toc marker locations
 * Replaces /toc lines with generated table of contents
 * @param markdown The markdown content
 * @param options Options for TOC generation
 * @returns Markdown with /toc markers replaced by generated TOC
 */
export function insertTOC(
  markdown: string,
  options: { minLevel?: number; maxLevel?: number } = {}
): string {
  const lines = markdown.split("\n");
  const markers = findTOCMarkers(lines);

  if (markers.length === 0) {
    // No /toc markers found, return unchanged
    return markdown;
  }

  // Parse all headings first (excluding /toc marker lines)
  const headings = parseHeadings(lines).filter((h) => !markers.includes(h.lineNumber));

  // Generate TOC
  const newTOC = generateTOC(headings, options.minLevel, options.maxLevel);

  if (newTOC.length === 0) {
    // No headings found, just remove the /toc markers
    const result = lines.filter((_, i) => !markers.includes(i));
    return result.join("\n");
  }

  // Replace markers in reverse order to preserve line numbers
  const result = [...lines];
  for (let i = markers.length - 1; i >= 0; i--) {
    const markerLine = markers[i];
    result.splice(markerLine, 1, ...newTOC);
  }

  return result.join("\n");
}

/**
 * Process TOC in markdown: handles both /toc markers and existing TOC refresh
 * First replaces /toc markers, then refreshes any existing TOC
 * @param markdown The markdown content
 * @param options Options for TOC generation
 * @returns Markdown with TOC processed
 */
export function processTOC(
  markdown: string,
  options: { minLevel?: number; maxLevel?: number } = {}
): string {
  // First, insert TOC at /toc markers
  let result = insertTOC(markdown, options);

  // Then refresh any existing TOC
  result = refreshTOC(result, options);

  return result;
}
