import React from 'react';
import { Box, Text } from 'ink';
import os from 'os';
import { execFileSync } from 'child_process';

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

export function WorkspaceContext() {
  const { cwd, branch, dirty } = getWorkspaceContext();

  return (
    <Box>
      <Text dimColor>
        {cwd} [<Text color="cyan">git: {branch}</Text>
        {dirty ? ' ⚡' : ''}]
      </Text>
    </Box>
  );
}
