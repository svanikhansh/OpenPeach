import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { TRUNCATE_THRESHOLD, truncateOutput } from '../lib/truncate-output.js';

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

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB max payload to prevent OOM

function getSessionLogDir(): string {
  const home = os.homedir();
  return path.join(home, '.openpeach', 'sessions');
}

function sanitizeSessionId(sessionId: string): string {
  // Only allow alphanumeric, dash, underscore to prevent path traversal
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getSessionLogPath(sessionId: string): string {
  const safeSessionId = sanitizeSessionId(sessionId);
  return path.join(getSessionLogDir(), `${safeSessionId}.jsonl`);
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
        // Read JSON payload from stdin with size limit to prevent OOM
        const stdin = process.stdin;
        let payload = '';
        let payloadSize = 0;
        for await (const chunk of stdin) {
          payloadSize += chunk.length;
          if (payloadSize > MAX_PAYLOAD_SIZE) {
            // Payload too large, exit silently to avoid breaking Claude Code
            process.exit(0);
            return;
          }
          payload += chunk;
        }

        if (!payload.trim()) {
          // No input, exit silently
          process.exit(0);
          return;
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