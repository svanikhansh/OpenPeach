import React from 'react';
import { Box, Text } from 'ink';
import { useWorkspaceContext } from './WorkspaceContext.js';

const DOTS = ['#FFF4E6', '#FF9671', '#845EC2'];

export function StatusLines() {
  const { isConnected, sessionStats, currentSessionId } = useWorkspaceContext();
  const tokensSaved = sessionStats?.tokensSaved ?? 0;
  const interventions = sessionStats?.interventions ?? 0;

  return (
    <Box flexDirection="column" paddingTop={1} paddingBottom={1}>
      <Text dimColor color="white">
        Version 0.0.1 · Commit dev-build
      </Text>

      <Box flexDirection="column" paddingTop={1}>
        <Text color="white">
          <Text color={DOTS[0]}>●</Text> {isConnected ? 'Hook: Connected' : 'Hook: Not connected'}
        </Text>
        <Text color="white">
          <Text color={DOTS[1]}>●</Text> Active Interceptors: PostToolUse (Bash, Read, Grep)
        </Text>
        <Text color="white">
          <Text color={DOTS[2]}>●</Text> Session: {currentSessionId ? (currentSessionId.length > 8 ? currentSessionId.slice(0, 8) + '...' : currentSessionId) : 'none'}
        </Text>
      </Box>

      <Box paddingTop={1}>
        <Text dimColor color="white">
          Savings Engine: {isConnected ? 'Active' : 'Inactive'}  ·  Tokens Intercepted: {tokensSaved}  ·  Interventions: {interventions}
        </Text>
      </Box>
    </Box>
  );
}
