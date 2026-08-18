import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

export function StatusLines() {
  return (
    <Box flexDirection="column" paddingTop={1} paddingBottom={1}>
      <Box>
        <Text backgroundColor="blue" color="white" bold>
          {' Version 0.0.1 '}
        </Text>
      </Box>

      <Box flexDirection="column" paddingTop={1}>
        <Text>
          {chalk.green('●')} Connected to OpenPeach Engine
        </Text>
        <Text>
          {chalk.magenta('●')} Logged in as: user
        </Text>
      </Box>
    </Box>
  );
}
