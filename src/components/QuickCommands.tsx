import React from 'react';
import { Box, Text } from 'ink';

const COMMANDS = ['/connect', '/stats', '/hooks', '/clear'];

export function QuickCommands() {
  return (
    <Box flexDirection="column">
      <Text dimColor color="white">Quick commands</Text>
      <Text color="white">
        {COMMANDS.map((command, index) => `${index + 1} ${command}`).join('  ')}
      </Text>
    </Box>
  );
}
