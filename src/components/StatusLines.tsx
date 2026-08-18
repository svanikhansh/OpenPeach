import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

const DOTS = ['#FFF4E6', '#FF9671', '#845EC2'];

export function StatusLines() {
  return (
    <Box flexDirection="column" paddingTop={1} paddingBottom={1}>
      <Text dimColor color="white">
        Version 0.0.1 · Commit dev-build
      </Text>

      <Box flexDirection="column" paddingTop={1}>
        <Text color="white">
          {chalk.hex(DOTS[0])('●')} Connected to OpenPeach Engine
        </Text>
        <Text color="white">
          {chalk.hex(DOTS[1])('●')} Active Interceptors: PostToolUse (Bash, Read, Grep)
        </Text>
        <Text color="white">
          {chalk.hex(DOTS[2])('●')} Logged in as: user
        </Text>
      </Box>

      <Box paddingTop={1}>
        <Text dimColor color="white">
          Savings Engine: Active  ·  Tokens Intercepted: 0 (0.0% compressed)
        </Text>
      </Box>
    </Box>
  );
}
