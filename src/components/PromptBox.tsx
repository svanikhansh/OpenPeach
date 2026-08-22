import React, { useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import TextInput from 'ink-text-input';

interface PromptBoxProps {
  onSubmit?: (query: string) => void;
  placeholder?: string;
  maxLength?: number;
}

function InteractivePrompt({ onSubmit, maxLength = 5000 }: { onSubmit?: (query: string) => void; maxLength?: number }) {
  const [query, setQuery] = useState('');

  useInput((input, key) => {
    if (key.return && query.trim().length > 0) {
      const trimmed = query.trim();
      if (onSubmit) {
        onSubmit(trimmed);
      }
      setQuery('');
    }
  });

  const handleChange = (value: string) => {
    // Sanitize: strip control characters, limit length
    const sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, maxLength);
    setQuery(sanitized);
  };

  return (
    <Box>
      <Text color="white">{'> '}</Text>
      <TextInput value={query} onChange={handleChange} />
    </Box>
  );
}

export function PromptBox({ onSubmit, placeholder, maxLength = 5000 }: PromptBoxProps) {
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
        {placeholder ?? '> Enter @ to mention files or / for commands'}
      </Text>
      {isRawModeSupported ? (
        <InteractivePrompt onSubmit={onSubmit} maxLength={maxLength} />
      ) : (
        <Text dimColor color="white">
          {'> (interactive input requires a TTY)'}
        </Text>
      )}
    </Box>
  );
}
