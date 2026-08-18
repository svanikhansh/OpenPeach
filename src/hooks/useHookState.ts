import { useState, useEffect, useCallback } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface SettingsFile {
  hooks?: {
    PostToolUse?: Array<{
      matcher: string;
      hooks: Array<{
        type: string;
        command: string;
      }>;
    }>;
  };
}

interface LogEntry {
  timestamp: string;
  tool_name: string;
  original_chars: number;
  truncated_chars: number;
  tokens_saved_estimate: number;
}

interface SessionStats {
  interventions: number;
  tokensSaved: number;
  lastIntervention: string | null;
}

interface HookState {
  projectPath: string | null;
  isConnected: boolean;
  sessionStats: SessionStats;
  currentSessionId: string | null;
}

const OUR_MATCHER = 'Bash|Read|Grep';
const OUR_COMMAND = 'peach hook posttooluse';

export function useHookState(): HookState {
  const [state, setState] = useState<HookState>({
    projectPath: null,
    isConnected: false,
    sessionStats: { interventions: 0, tokensSaved: 0, lastIntervention: null },
    currentSessionId: null,
  });

  // Detect project path and connection state
  useEffect(() => {
    const detectProject = async () => {
      let currentDir = process.cwd();
      let found = false;

      while (currentDir !== path.parse(currentDir).root) {
        const claudeDir = path.join(currentDir, '.claude');
        try {
          const stat = await fs.stat(claudeDir);
          if (stat.isDirectory()) {
            found = true;
            break;
          }
        } catch {
          // Not found, continue up
        }
        currentDir = path.dirname(currentDir);
      }

      if (!found) {
        // Check if we're in a .claude dir already
        const cwd = process.cwd();
        if (path.basename(cwd) === '.claude') {
          currentDir = path.dirname(cwd);
          found = true;
        }
      }

      let isConnected = false;
      if (found) {
        const settingsPath = path.join(currentDir, '.claude', 'settings.json');
        try {
          const content = await fs.readFile(settingsPath, 'utf8');
          const settings: SettingsFile = JSON.parse(content);
          const postToolUse = settings.hooks?.PostToolUse ?? [];
          isConnected = postToolUse.some(
            (entry) =>
              entry.matcher === OUR_MATCHER &&
              entry.hooks.some((h) => h.type === 'command' && h.command === OUR_COMMAND)
          );
        } catch {
          isConnected = false;
        }
      }

      setState((prev) => ({ ...prev, projectPath: found ? currentDir : null, isConnected }));
    };

    detectProject();
  }, []);

  // Poll session stats
  useEffect(() => {
    if (!state.projectPath) return;

    const pollInterval = setInterval(async () => {
      // Find the most recent session log file
      const logDir = path.join(os.homedir(), '.openpeach', 'sessions');
      let sessionId: string | null = null;
      let latestTime = 0;

      try {
        const files = await fs.readdir(logDir);
        for (const file of files) {
          if (file.endsWith('.jsonl')) {
            const filePath = path.join(logDir, file);
            const stat = await fs.stat(filePath);
            if (stat.mtimeMs > latestTime) {
              latestTime = stat.mtimeMs;
              sessionId = file.replace('.jsonl', '');
            }
          }
        }
      } catch {
        // No log dir or no sessions
      }

      if (!sessionId) {
        setState((prev) => ({
          ...prev,
          currentSessionId: null,
          sessionStats: { interventions: 0, tokensSaved: 0, lastIntervention: null },
        }));
        return;
      }

      // Read the session log
      const logPath = path.join(logDir, `${sessionId}.jsonl`);
      let interventions = 0;
      let tokensSaved = 0;
      let lastIntervention: string | null = null;

      try {
        const content = await fs.readFile(logPath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const entry: LogEntry = JSON.parse(line);
            interventions++;
            tokensSaved += entry.tokens_saved_estimate;
            lastIntervention = entry.timestamp;
          } catch {
            // Skip malformed lines
          }
        }
      } catch {
        // Log not readable
      }

      setState((prev) => ({
        ...prev,
        currentSessionId: sessionId,
        sessionStats: { interventions, tokensSaved, lastIntervention },
      }));
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [state.projectPath]);

  return state;
}