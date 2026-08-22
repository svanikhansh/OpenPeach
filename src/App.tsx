import React, { useCallback, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Banner } from './components/Banner.js';
import { StatusLines } from './components/StatusLines.js';
import { WorkspaceContextDisplay, WorkspaceContextProvider, useWorkspaceContext } from './components/WorkspaceContext.js';
import { QuickCommands } from './components/QuickCommands.js';
import { PromptBox } from './components/PromptBox.js';
import { ShortcutBar } from './components/ShortcutBar.js';
import { connectProject } from './commands/connect.js';

const QUICK_COMMANDS = ['/connect', '/stats', '/hooks', '/clear'];
const MAX_ACTIVITY_ITEMS = 6;

function ActivityFeed({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      {items.map((item, index) => (
        <Text key={`${item}-${index}`} color={index === items.length - 1 ? '#FFF4E6' : 'gray'}>
          {item}
        </Text>
      ))}
    </Box>
  );
}

function TuiContent() {
  const { exit } = useApp();
  const { isConnected, projectPath, sessionStats, currentSessionId, refresh } = useWorkspaceContext();
  const [activity, setActivity] = useState<string[]>([]);

  const addActivity = useCallback((message: string) => {
    setActivity((items) => [...items, message].slice(-MAX_ACTIVITY_ITEMS));
  }, []);

  const handleCommand = useCallback(async (input: string) => {
    const command = input.trim().toLowerCase();
    const commandWithSlash = command.startsWith('/') ? command : `/${command}`;
    const normalized = /^\/[1-4]$/.test(commandWithSlash)
      ? QUICK_COMMANDS[Number(commandWithSlash.slice(1)) - 1]
      : commandWithSlash;

    if (normalized === '/clear') {
      setActivity([]);
      return;
    }

    if (normalized === '/connect') {
      addActivity('> /connect');
      try {
        const result = await connectProject();
        addActivity(result.message);
        refresh();
      } catch {
        addActivity('Unable to update .claude/settings.json.');
      }
      return;
    }

    if (normalized === '/stats') {
      addActivity('> /stats');
      addActivity(
        `Session ${currentSessionId ?? 'none'} · ${sessionStats.interventions} interventions · ~${sessionStats.tokensSaved} tokens saved`
      );
      return;
    }

    if (normalized === '/hooks') {
      addActivity('> /hooks');
      addActivity(
        isConnected
          ? `PostToolUse active for Bash, Read, Grep${projectPath ? ` · ${projectPath}` : ''}`
          : 'PostToolUse is not connected. Run /connect after initializing Claude Code.'
      );
      return;
    }

    if (normalized.startsWith('/')) {
      addActivity(`Unknown command: ${normalized}. Try /connect, /stats, /hooks, or /clear.`);
      return;
    }

    addActivity(`Prompt received: ${input.trim()}`);
  }, [addActivity, currentSessionId, isConnected, projectPath, refresh, sessionStats]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }

    if (key.ctrl && input === 'r') {
      refresh();
      addActivity('Workspace status refreshed.');
    }
  });

  return (
    <Box
      flexDirection="column"
      height="100%"
      width="100%"
      justifyContent="space-between"
      paddingY={1}
    >
      <Box flexDirection="column">
        <Banner />
        <StatusLines />
      </Box>

      <Box flexDirection="column">
        <ActivityFeed items={activity} />
        <QuickCommands />
        <WorkspaceContextDisplay />
        <PromptBox onSubmit={handleCommand} />
        <ShortcutBar />
      </Box>
    </Box>
  );
}

export function App() {
  return (
    <WorkspaceContextProvider>
      <TuiContent />
    </WorkspaceContextProvider>
  );
}
