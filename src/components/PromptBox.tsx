import React, { useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import TextInput from 'ink-text-input';

function InteractivePrompt() {
  const [query, setQuery] = useState('');

  useInput((input, key) => {
    if (key.return && query.trim().length > 0) {
      setQuery('');
    }
  });

  return (
    <Box>
      <Text>{'> '}</Text>
      <TextInput value={query} onChange={setQuery} />
    </Box>
  );
}

export function PromptBox() {
  const { isRawModeSupported } = useStdin();

  return (
    <Box borderStyle="round" flexDirection="column" paddingX={1}>
      <Text dimColor>
        {'> Enter @ to mention files or / for commands'}
      </Text>
      {isRawModeSupported ? (
        <InteractivePrompt />
      ) : (
        <Text dimColor>{'> (interactive input requires a TTY)'}</Text>
      )}
    </Box>
  );
}
