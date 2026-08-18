import React from 'react';
import { Box, Text } from 'ink';
import figlet from 'figlet';
import gradient from 'gradient-string';

const SUNSET_COLORS = [
  '#FF416C',
  '#FF4E50',
  '#F9D423',
  '#FFFFFF',
  '#FF007F',
  '#7F00FF',
];

export function Banner() {
  const ascii = figlet.textSync('OpenPeach', { font: 'Standard' });
  const colored = gradient(SUNSET_COLORS)(ascii);
  const lines = colored.split('\n');

  return (
    <Box
      borderStyle="single"
      flexDirection="column"
      alignItems="center"
      paddingX={1}
    >
      {lines.map((line, index) => (
        <Text key={index}>{line}</Text>
      ))}
    </Box>
  );
}
