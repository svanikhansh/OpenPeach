export const TRUNCATE_THRESHOLD = 2000;
export const HEAD_CHAR_BUDGET = 1200;
export const TAIL_CHAR_BUDGET = 600;
export const MAX_ANCHOR_BLOCKS = 15;
export const ANCHOR_CONTEXT_LINES = 2;

// Important lines: errors, failures, assertions, stack traces
const ANCHOR_PATTERN = /error|fail|exception|✗|assert|expected:|received:|traceback/i;

// Actual code changes in diff output: +/- followed by real content.
// Tolerates one leading space so hunks embedded in other output still match;
// purely-whitespace changes are ignored.
const DIFF_CHANGE_PATTERN = /^ ?[+-]\s*\S/;

// Diff file headers, likewise tolerant of a leading space
const DIFF_HEADER_PATTERN = /^ ?(diff --git|--- |\+\+\+ )/;

interface AnchorBlock {
  startIdx: number;
  endIdx: number;
}

function isAnchorLine(line: string, isDiffOutput: boolean): boolean {
  return ANCHOR_PATTERN.test(line) ||
    (isDiffOutput && (DIFF_CHANGE_PATTERN.test(line) || DIFF_HEADER_PATTERN.test(line)));
}

// Largest slice of `lines` starting at 0 whose total char cost (with newlines)
// fits the budget. Always includes at least one line.
function fitLinesFromStart(lines: string[], budget: number): number {
  let used = 0;
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const cost = lines[i].length + 1;
    if (count > 0 && used + cost > budget) break;
    used += cost;
    count++;
  }
  return count;
}

// Smallest start index such that the lines from there to the end fit the
// budget. Always includes at least the last line.
function fitLinesFromEnd(lines: string[], budget: number): number {
  let used = 0;
  let count = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const cost = lines[i].length + 1;
    if (count > 0 && used + cost > budget) break;
    used += cost;
    count++;
  }
  return lines.length - count;
}

// Raw character slicing for degenerate shapes (one huge line, or budgets that
// would overlap). Always produces output strictly smaller than the input when
// the input exceeds TRUNCATE_THRESHOLD.
function hardCharTruncate(output: string): { truncated: string; originalChars: number; truncatedChars: number } {
  const head = output.slice(0, HEAD_CHAR_BUDGET);
  const tail = output.slice(-TAIL_CHAR_BUDGET);
  const omitted = Math.max(0, output.length - HEAD_CHAR_BUDGET - TAIL_CHAR_BUDGET);
  const truncated = `${head}\n[...${omitted} chars omitted...]\n${tail}`;
  return { truncated, originalChars: output.length, truncatedChars: truncated.length };
}

// Collect anchor blocks from the omitted middle region, in original order.
// Each block keeps the matched line plus ANCHOR_CONTEXT_LINES of context on
// each side; overlapping windows merge. Stops collecting at MAX_ANCHOR_BLOCKS
// but keeps counting further matches so the caller can report them.
function collectAnchorBlocks(middleLines: string[], isDiffOutput: boolean): { blocks: AnchorBlock[]; additionalMatches: number } {
  const blocks: AnchorBlock[] = [];
  let additionalMatches = 0;

  for (let i = 0; i < middleLines.length; i++) {
    if (!isAnchorLine(middleLines[i], isDiffOutput)) continue;

    const contextStart = Math.max(0, i - ANCHOR_CONTEXT_LINES);
    const contextEnd = Math.min(middleLines.length, i + ANCHOR_CONTEXT_LINES + 1);
    const last = blocks[blocks.length - 1];

    if (last && contextStart <= last.endIdx) {
      last.endIdx = Math.max(last.endIdx, contextEnd);
      continue;
    }

    if (blocks.length >= MAX_ANCHOR_BLOCKS) {
      additionalMatches++;
      continue;
    }

    blocks.push({ startIdx: contextStart, endIdx: contextEnd });
  }

  return { blocks, additionalMatches };
}

export function truncateOutput(output: string): { truncated: string; originalChars: number; truncatedChars: number } {
  const originalChars = output.length;

  // The single gate: only total character length decides whether to truncate
  if (originalChars <= TRUNCATE_THRESHOLD) {
    return { truncated: output, originalChars, truncatedChars: originalChars };
  }

  const lines = output.split('\n');

  if (lines.length <= 1) {
    return hardCharTruncate(output);
  }

  const headEndIdx = fitLinesFromStart(lines, HEAD_CHAR_BUDGET);
  const tailStartIdx = fitLinesFromEnd(lines, TAIL_CHAR_BUDGET);

  // Budgets cover the whole output - fall back to raw char slicing so we
  // always shrink past the gate
  if (headEndIdx >= tailStartIdx) {
    return hardCharTruncate(output);
  }

  const headLines = lines.slice(0, headEndIdx);
  const tailLines = lines.slice(tailStartIdx);
  const middleLines = lines.slice(headEndIdx, tailStartIdx);

  const isDiffOutput = lines.some((line) => DIFF_HEADER_PATTERN.test(line));
  const { blocks, additionalMatches } = collectAnchorBlocks(middleLines, isDiffOutput);

  let result = headLines.join('\n');
  let consumedUpTo = 0;

  for (const block of blocks) {
    const omittedBefore = block.startIdx - consumedUpTo;
    if (omittedBefore > 0) {
      result += `\n[...${omittedBefore} lines omitted...]`;
    }
    const blockLines = middleLines.slice(block.startIdx, block.endIdx);
    result += `\n>>> ${blockLines.join('\n')}`;
    consumedUpTo = block.endIdx;
  }

  const omittedAfter = middleLines.length - consumedUpTo;
  if (omittedAfter > 0) {
    result += `\n[...${omittedAfter} lines omitted...]`;
  }

  if (additionalMatches > 0) {
    result += `\n[...+${additionalMatches} additional matches omitted...]`;
  }

  result += `\n${tailLines.join('\n')}`;

  return { truncated: result, originalChars, truncatedChars: result.length };
}
