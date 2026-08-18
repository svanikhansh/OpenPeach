import React, { createContext, useContext, useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import os from 'os';
import { execFileSync } from 'child_process';
import { useHookState } from '../hooks/useHookState.js';

interface WorkspaceContextValue {
  cwd: string;
  branch: string;
  dirty: boolean;
  projectPath: string | null;
  isConnected: boolean;
  sessionStats: {
    interventions: number;
    tokensSaved: number;
    lastIntervention: string | null;
  };
  currentSessionId: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceContextProvider');
  }
  return context;
}

function getWorkspaceContext() {
  const cwd = process.cwd().replace(os.homedir(), '~');
  let branch = 'unknown';
  let dirty = false;

  try {
    branch = execFileSync('git', ['branch', '--show-current'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    dirty = status.length > 0;
  } catch {
    // Not a git repository or git is unavailable.
  }

  return { cwd, branch, dirty };
}

export function WorkspaceContextProvider({ children }: { children: React.ReactNode }) {
  const { cwd, branch, dirty } = getWorkspaceContext();
  const hookState = useHookState();

  return (
    <WorkspaceContext.Provider
      value={{
        cwd,
        branch,
        dirty,
        projectPath: hookState.projectPath,
        isConnected: hookState.isConnected,
        sessionStats: hookState.sessionStats,
        currentSessionId: hookState.currentSessionId,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function WorkspaceContextDisplay() {
  const { cwd, branch, dirty, isConnected, sessionStats, currentSessionId } = useWorkspaceContext();

  return (
    <Box paddingTop={1}>
      <Text dimColor color="white">
        {cwd} [<Text color="#FF9671">git: {branch}</Text>
        {dirty ? ' *' : ''}]
      </Text>
      <Text dimColor color="white">
        {isConnected ? (
          <>
            <Text color="#FF9671"> ● Hook: Connected</Text>
          </>
        ) : (
          <>
            <Text color="gray"> ● Hook: Not connected (run <Text color="#FF9671">peach connect</Text>)</Text>
          </>
        )}
      </Text>
      {currentSessionId && (
        <Text dimColor color="white">
          Session: {currentSessionId.slice(0, 8)}... · Interventions: {sessionStats.interventions} · Tokens saved: ~{sessionStats.tokensSaved}
        </Text>
      )}
    </Box>
  );
}
