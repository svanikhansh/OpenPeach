import { useState, useEffect, useRef, useCallback } from 'react';
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
  refresh: () => void;
  isConnected: boolean;
  sessionStats: SessionStats;
  currentSessionId: string | null;
}

const OUR_MATCHER = 'Bash|Read|Grep';
const OUR_COMMAND = 'peach hook posttooluse';
const MAX_TRAVERSAL_DEPTH = 50;

function getSessionLogDir(): string {
  return path.join(os.homedir(), '.openpeach', 'sessions');
}

export function useHookState(): HookState {
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<HookState>({
    projectPath: null,
    refresh: () => {},
    isConnected: false,
    sessionStats: { interventions: 0, tokensSaved: 0, lastIntervention: null },
    currentSessionId: null,
  });

  const logPositionRef = useRef<Map<string, number>>(new Map());
  const watchedDirsRef = useRef<Set<string>>(new Set());

  // Detect project path and connection state
  useEffect(() => {
    const detectProject = async () => {
      let currentDir = process.cwd();
      let found = false;
      const visited = new Set<string>();
      let depth = 0;

      while (currentDir !== path.parse(currentDir).root && depth < MAX_TRAVERSAL_DEPTH) {
        // Prevent symlink cycles
        const resolved = path.resolve(currentDir);
        if (visited.has(resolved)) {
          break;
        }
        visited.add(resolved);

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
        depth++;
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
  }, [refreshToken]);

  // Poll session stats using fs.watch for efficiency
  useEffect(() => {
    if (!state.projectPath) return;

    const logDir = getSessionLogDir();

    // Ensure log directory exists
    fs.mkdir(logDir, { recursive: true }).catch(() => {});

    let sessionId: string | null = null;
    let lastSize = 0;

    const pollInterval = setInterval(async () => {
      try {
        // Find the most recent session log file
        const files = await fs.readdir(logDir);
        let latestTime = 0;
        let latestFile: string | null = null;

        for (const file of files) {
          if (file.endsWith('.jsonl')) {
            const filePath = path.join(logDir, file);
            const stat = await fs.stat(filePath);
            if (stat.mtimeMs > latestTime) {
              latestTime = stat.mtimeMs;
              latestFile = file;
            }
          }
        }

        if (!latestFile) {
          setState((prev) => ({
            ...prev,
            currentSessionId: null,
            sessionStats: { interventions: 0, tokensSaved: 0, lastIntervention: null },
          }));
          return;
        }

        const newSessionId = latestFile.replace('.jsonl', '');
        const logPath = path.join(logDir, latestFile);

        // Check if session changed
        if (newSessionId !== sessionId) {
          sessionId = newSessionId;
          lastSize = 0;
          logPositionRef.current.clear();
        }

        // Read only new lines since last position
        const stat = await fs.stat(logPath);
        if (stat.size <= lastSize) {
          return; // No new data
        }

        const fd = await fs.open(logPath, 'r');
        const buffer = Buffer.alloc(stat.size - lastSize);
        await fd.read(buffer, 0, buffer.length, lastSize);
        await fd.close();

        const newContent = buffer.toString('utf8');
        lastSize = stat.size;

        let interventions = 0;
        let tokensSaved = 0;
        let lastIntervention: string | null = null;

        const lines = newContent.trim().split('\n').filter(Boolean);
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

        // Accumulate with existing stats
        setState((prev) => ({
          ...prev,
          currentSessionId: sessionId,
          sessionStats: {
            interventions: prev.sessionStats.interventions + interventions,
            tokensSaved: prev.sessionStats.tokensSaved + tokensSaved,
            lastIntervention: lastIntervention ?? prev.sessionStats.lastIntervention,
          },
        }));
      } catch {
        // Ignore errors during polling
      }
    }, 5000); // Poll every 5 seconds (reduced from 2s)

    return () => clearInterval(pollInterval);
  }, [state.projectPath]);

  return {
    ...state,
    refresh: () => setRefreshToken((value) => value + 1),
  };
}