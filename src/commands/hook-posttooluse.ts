import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface PostToolUsePayload {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: {
    stdout?: string;
    stderr?: string;
    output?: string;
    [key: string]: unknown;
  };
  cwd: string;
}

interface LogEntry {
  timestamp: string;
  tool_name: string;
  original_chars: number;
  truncated_chars: number;
  tokens_saved_estimate: number;
}

const TRUNCATE_THRESHOLD = 2000;
const HEAD_LINES = 40;
const TAIL_LINES = 20;

function getSessionLogDir(): string {
  const home = os.homedir();
  return path.join(home, '.openpeach', 'sessions');
}

function getSessionLogPath(sessionId: string): string {
  return path.join(getSessionLogDir(), `${sessionId}.jsonl`);
}

function truncateOutput(output: string): { truncated: string; originalChars: number; truncatedChars: number } {
  const lines = output.split('\n');
  const originalChars = output.length;

  if (originalChars <= TRUNCATE_THRESHOLD) {
    return { truncated: output, originalChars, truncatedChars: originalChars };
  }

  if (lines.length <= HEAD_LINES + TAIL_LINES) {
    return { truncated: output, originalChars, truncatedChars: originalChars };
  }

  const head = lines.slice(0, HEAD_LINES).join('\n');
  const tail = lines.slice(-TAIL_LINES).join('\n');
  const omittedCount = lines.length - HEAD_LINES - TAIL_LINES;
  const truncated = `${head}\n[...${omittedCount} lines omitted...]\n${tail}`;
  const truncatedChars = truncated.length;

  return { truncated, originalChars, truncatedChars };
}

function estimateTokensSaved(originalChars: number, truncatedChars: number): number {
  return Math.round((originalChars - truncatedChars) / 4);
}

async function appendLogEntry(sessionId: string, entry: LogEntry): Promise<void> {
  const logDir = getSessionLogDir();
  const logPath = getSessionLogPath(sessionId);

  await fs.mkdir(logDir, { recursive: true });
  await fs.appendFile(logPath, JSON.stringify(entry) + '\n');
}

export const hookPostToolUseCommand = new Command('hook')
  .description('Hook commands (invoked by Claude Code)')
  .addCommand(
    new Command('posttooluse')
      .description('PostToolUse hook handler - truncates long tool output')
      .action(async () => {
        // Read JSON payload from stdin
        const stdin = process.stdin;
        let payload = '';
        for await (const chunk of stdin) {
          payload += chunk;
        }

        if (!payload.trim()) {
          // No input, exit silently
          process.exit(0);
        }

        let data: PostToolUsePayload;
        try {
          data = JSON.parse(payload);
        } catch {
          // Invalid JSON, exit silently (don't break Claude Code)
          process.exit(0);
          return;
        }

        // Extract output from tool_response
        const response = data.tool_response;
        const output = response.output ?? response.stdout ?? response.stderr ?? '';

        if (typeof output !== 'string' || output.length <= TRUNCATE_THRESHOLD) {
          // Under threshold, no-op
          process.exit(0);
          return;
        }

        // Truncate if needed
        const { truncated, originalChars, truncatedChars } = truncateOutput(output);

        if (originalChars === truncatedChars) {
          // No actual truncation happened
          process.exit(0);
          return;
        }

        const tokensSaved = estimateTokensSaved(originalChars, truncatedChars);

        // Log the intervention
        const logEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          tool_name: data.tool_name,
          original_chars: originalChars,
          truncated_chars: truncatedChars,
          tokens_saved_estimate: tokensSaved,
        };

        try {
          await appendLogEntry(data.session_id, logEntry);
        } catch {
          // Log failure shouldn't break the hook
        }

        // Emit updated output for Claude Code
        const hookOutput = {
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            updatedToolOutput: truncated,
          },
        };

        console.log(JSON.stringify(hookOutput));
        process.exit(0);
      })
  );