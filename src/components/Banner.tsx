import React from 'react';
import { Box, Text } from 'ink';
import gradient from 'gradient-string';

const PEACH_SUNSET = [
  '#FFF4E6',
  '#FFE3D1',
  '#FF9671',
  '#FF6F91',
  '#845EC2',
];

const BLOCK_FONT: Record<string, string[]> = {
  O: [
    ' █████ ',
    '██   ██',
    '██   ██',
    '██   ██',
    '██   ██',
    '██   ██',
    ' █████ ',
  ],
  P: [
    '██████ ',
    '██   ██',
    '██████ ',
    '██     ',
    '██     ',
    '██     ',
    '██     ',
  ],
  E: [
    '███████',
    '██     ',
    '██████ ',
    '██     ',
    '██     ',
    '██     ',
    '███████',
  ],
  N: [
    '██   ██',
    '███  ██',
    '████ ██',
    '██ ████',
    '██  ███',
    '██   ██',
    '██   ██',
  ],
  A: [
    '  ███  ',
    ' ██ ██ ',
    '███████',
    '██   ██',
    '██   ██',
    '██   ██',
    '██   ██',
  ],
  C: [
    ' █████ ',
    '██   ██',
    '██     ',
    '██     ',
    '██     ',
    '██   ██',
    ' █████ ',
  ],
  H: [
    '██   ██',
    '██   ██',
    '███████',
    '██   ██',
    '██   ██',
    '██   ██',
    '██   ██',
  ],
};

const LABEL = 'OPENPEACH';

function buildTextRows(): string[] {
  const rows: string[] = [];
  for (let r = 0; r < 7; r++) {
    const parts: string[] = [];
    for (const char of LABEL) {
      parts.push(BLOCK_FONT[char][r]);
    }
    rows.push(parts.join(' '));
  }
  return rows;
}

export function Banner() {
  const textRows = buildTextRows();
  const leftIndent = ' ';
  const coloredRows = textRows.map((row) => leftIndent + gradient(PEACH_SUNSET)(row));

  return (
    <Box flexDirection="column" width="100%">
      <Box justifyContent="space-between">
        <Text color="white">┌  Welcome to OpenPeach</Text>
        <Text color="white">┐</Text>
      </Box>

      <Box flexDirection="column" alignItems="flex-start">
        {coloredRows.map((line, index) => (
          <Text key={index}>{line}</Text>
        ))}
      </Box>

      <Box justifyContent="space-between">
        <Text color="white">└</Text>
        <Text color="white">CLI Version 0.0.1  </Text>
      </Box>
    </Box>
  );
}
