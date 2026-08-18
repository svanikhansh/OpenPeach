import React from 'react';
import { Box, Text } from 'ink';

const COMMANDS = ['/connect', '/stats', '/hooks', '/clear'];

export function QuickCommands() {
  return (
    <Box>
      <Text dimColor>
        Quick commands: {COMMANDS.join('  ')}
      </Text>
    </Box>
  );
}
