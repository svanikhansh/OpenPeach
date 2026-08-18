import React from 'react';
import { Box, useApp, useInput, useStdin } from 'ink';
import { Banner } from './components/Banner.js';
import { StatusLines } from './components/StatusLines.js';
import { PromptBox } from './components/PromptBox.js';
import { ShortcutBar } from './components/ShortcutBar.js';

function InputHandler() {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }

    if (key.ctrl && input === 'r') {
      // Placeholder for expand-all shortcut
    }
  });

  return null;
}

export function App() {
  const { isRawModeSupported } = useStdin();

  return (
    <Box
      flexDirection="column"
      height="100%"
      justifyContent="space-between"
    >
      {isRawModeSupported && <InputHandler />}

      <Box flexDirection="column">
        <Banner />
        <StatusLines />
      </Box>

      <Box flexDirection="column">
        <PromptBox />
        <ShortcutBar />
      </Box>
    </Box>
  );
}
