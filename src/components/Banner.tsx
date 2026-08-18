import React from 'react';
import { Box, Text } from 'ink';
import gradient from 'gradient-string';

const PEACH_SUNSET = ['#FF5E62', '#FF9966', '#FFC3A0', '#8E2DE2'];

const BLOCK_FONT: Record<string, string[]> = {
  O: ['█████', '█   █', '█   █', '█   █', '█████'],
  P: ['█████', '█   █', '█████', '█    ', '█    '],
  E: ['█████', '█    ', '████ ', '█    ', '█████'],
  N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
  A: [' ███ ', '█   █', '█████', '█   █', '█   █'],
  C: [' ████', '█    ', '█    ', '█    ', ' ████'],
  H: ['█   █', '█   █', '█████', '█   █', '█   █'],
};

const LABEL = 'OPENPEACH';
const ICON_GAP = 3;
const PEACH_ICON = [
  '    █████    ',
  '  █████████  ',
  ' ███████████ ',
  '█████████████',
  '█████████████',
  ' ████   ████ ',
  '  ███   ███  ',
  '   ███████   ',
];

function buildTextRows(): string[] {
  const rows: string[] = [];
  for (let r = 0; r < 5; r++) {
    const parts: string[] = [];
    for (const char of LABEL) {
      parts.push(BLOCK_FONT[char][r]);
    }
    rows.push(parts.join(' '));
  }
  return rows;
}

function buildContentRows(): string[] {
  const textRows = buildTextRows();
  const textWidth = textRows[0].length;
  const totalHeight = PEACH_ICON.length;
  const topPad = Math.ceil((totalHeight - textRows.length) / 2);
  const bottomPad = totalHeight - textRows.length - topPad;

  const paddedText: string[] = [
    ...Array(topPad).fill(' '.repeat(textWidth)),
    ...textRows,
    ...Array(bottomPad).fill(' '.repeat(textWidth)),
  ];

  return paddedText.map((line, i) => line + ' '.repeat(ICON_GAP) + PEACH_ICON[i]);
}

export function Banner() {
  const contentRows = buildContentRows();
  const contentWidth = contentRows[0].length;

  const topInside = `   Welcome to OpenPeach${' '.repeat(contentWidth - 23)}`;
  const bottomInside = `${' '.repeat(contentWidth - 20)}CLI Version 0.0.1   `;

  const topFrame = `┌${topInside}┐`;
  const bottomFrame = `└${bottomInside}┘`;

  const coloredRows = contentRows.map((row) => gradient(PEACH_SUNSET)(row));

  return (
    <Box flexDirection="column">
      <Text>{topFrame}</Text>
      {coloredRows.map((line, index) => (
        <Text key={index}>{line}</Text>
      ))}
      <Text>{bottomFrame}</Text>
    </Box>
  );
}
