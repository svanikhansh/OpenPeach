import React from 'react';
import { Box, Text } from 'ink';

export function ShortcutBar() {
  return (
    <Box paddingTop={1}>
      <Text dimColor>Ctrl+C Exit · Ctrl+R Expand all</Text>
    </Box>
  );
}
