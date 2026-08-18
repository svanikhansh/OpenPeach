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
    ' ██████ ',
    '██    ██',
    '██    ██',
    '██    ██',
    '██    ██',
    '██    ██',
    ' ██████ ',
  ],
  P: [
    '████████',
    '██    ██',
    '████████',
    '██      ',
    '██      ',
    '██      ',
    '██      ',
  ],
  E: [
    '████████',
    '██      ',
    '████████',
    '██      ',
    '██      ',
    '██      ',
    '████████',
  ],
  N: [
    '██    ██',
    '███   ██',
    '████  ██',
    '██ ██ ██',
    '██  ████',
    '██   ███',
    '██    ██',
  ],
  A: [
    '  ████  ',
    ' ██  ██ ',
    '████████',
    '██    ██',
    '██    ██',
    '██    ██',
    '██    ██',
  ],
  C: [
    ' ██████ ',
    '██    ██',
    '██      ',
    '██      ',
    '██      ',
    '██    ██',
    ' ██████ ',
  ],
  H: [
    '██    ██',
    '██    ██',
    '████████',
    '██    ██',
    '██    ██',
    '██    ██',
    '██    ██',
  ],
};

const LABEL = 'OPENPEACH';
const FRAME_WIDTH = 84;
const INSIDE_WIDTH = FRAME_WIDTH - 2;

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
  const leftIndent = '  ';
  const coloredRows = textRows.map((row) => leftIndent + gradient(PEACH_SUNSET)(row));

  const topLabel = '  Welcome to OpenPeach';
  const topInside = topLabel + ' '.repeat(INSIDE_WIDTH - topLabel.length);

  const bottomLabel = 'CLI Version 0.0.1  ';
  const bottomInside = ' '.repeat(INSIDE_WIDTH - bottomLabel.length) + bottomLabel;

  return (
    <Box flexDirection="column" width={FRAME_WIDTH}>
      <Text>{`┌${topInside}┐`}</Text>
      {coloredRows.map((line, index) => (
        <Text key={index}>{line}</Text>
      ))}
      <Text>{`└${bottomInside}┘`}</Text>
    </Box>
  );
}
