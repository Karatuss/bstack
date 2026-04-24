import React, { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { paint } from '../theme.js';

const LOGO = [
  '  ____    _                  _    ',
  ' | __ )  / ___| | ___  ___  | | __',
  " |  _ \\  \\___ \\ |/ _ \\/ __| | |/ /",
  ' | |_) |  ___) |  __/ (__  |   < ',
  ' |____/  |____/\\___|\\___| |_|\\_\\',
].join('\n');

export function Welcome({ onContinue }: { onContinue: () => void }) {
  useInput((_, key) => {
    if (key.return) onContinue();
  });
  useEffect(() => {
    // auto-advance after key input via useInput; no timer needed
  }, []);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{paint.primary(LOGO)}</Text>
      <Box marginTop={1}>
        <Text>{paint.bold('bstack')} — Backend-Specialized Claude Code Harness</Text>
      </Box>
      <Text>{paint.muted('Java · Spring Boot · 동료 협업 톤 · 정량 지표 · 런타임 관측')}</Text>
      <Box marginTop={1}>
        <Text>{paint.accent('▸')} 설치 마법사를 시작하려면 Enter</Text>
      </Box>
    </Box>
  );
}
