import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { paint } from '../theme.js';
import { Variant } from './VariantPicker.js';
import { InstallMode } from './ModePicker.js';

export interface InstallConfig {
  variant: Variant;
  mode: InstallMode;
  skills: string[];
  projectDir?: string;
}

export function Summary({
  config,
  onConfirm,
  onCancel,
}: {
  config: InstallConfig;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);

  useInput((input, key) => {
    if (busy) return;
    if (key.return) {
      setBusy(true);
      onConfirm();
    } else if (input === 'q' || key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{paint.bold('4/4')} {paint.primary('요약 및 확인')}</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>Variant  : {paint.accent(config.variant)}</Text>
        <Text>Mode     : {paint.accent(config.mode)}</Text>
        {config.projectDir && <Text>Project  : {paint.accent(config.projectDir)}</Text>}
        <Text>Skills   : {paint.accent(`${config.skills.length}개`)}  {paint.muted(config.skills.join(', '))}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>{paint.accent('▸')} Enter=설치 시작  · q=취소</Text>
      </Box>
    </Box>
  );
}
