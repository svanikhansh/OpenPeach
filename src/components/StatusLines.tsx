import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import { useWorkspaceContext } from './WorkspaceContext.js';

const DOTS = ['#FFF4E6', '#FF9671', '#845EC2'];

export function StatusLines() {
  const { isConnected, sessionStats, currentSessionId } = useWorkspaceContext();

  return (
    <Box flexDirection="column" paddingTop={1} paddingBottom={1}>
      <Text dimColor color="white">
        Version 0.0.1 · Commit dev-build
      </Text>

      <Box flexDirection="column" paddingTop={1}>
        <Text color="white">
          {chalk.hex(DOTS[0])('●')} {isConnected ? 'Hook: Connected' : 'Hook: Not connected'}
        </Text>
        <Text color="white">
          {chalk.hex(DOTS[1])('●')} Active Interceptors: PostToolUse (Bash, Read, Grep)
        </Text>
        <Text color="white">
          {chalk.hex(DOTS[2])('●')} Session: {currentSessionId ? currentSessionId.slice(0, 8) + '...' : 'none'}
        </Text>
      </Box>

      <Box paddingTop={1}>
        <Text dimColor color="white">
          Savings Engine: {isConnected ? 'Active' : 'Inactive'}  ·  Tokens Intercepted: {sessionStats.tokensSaved}  ·  Interventions: {sessionStats.interventions}
        </Text>
      </Box>
    </Box>
  );
}
