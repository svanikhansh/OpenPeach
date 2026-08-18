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
      <Text color="white">{'> '}</Text>
      <TextInput value={query} onChange={setQuery} />
    </Box>
  );
}

export function PromptBox() {
  const { isRawModeSupported } = useStdin();

  return (
    <Box
      borderStyle="round"
      borderColor="#FF9671"
      flexDirection="column"
      paddingX={1}
      marginTop={1}
      width="100%"
    >
      <Text dimColor color="white">
        {'> Enter @ to mention files or / for commands'}
      </Text>
      {isRawModeSupported ? (
        <InteractivePrompt />
      ) : (
        <Text dimColor color="white">
          {'> (interactive input requires a TTY)'}
        </Text>
      )}
    </Box>
  );
}
