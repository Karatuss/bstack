import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { paint } from '../theme.js';

export type Variant = 'CLAUDE' | 'AGENTS';

export function VariantPicker({ onSelect }: { onSelect: (v: Variant) => void }) {
  const items = [
    { label: 'CLAUDE variant  — Claude Code 전용 (CLAUDE.md + .claude/skills/)', value: 'CLAUDE' as const },
    { label: 'AGENTS variant  — Codex/Cursor/Antigravity/Gemini CLI (AGENTS.md + .agents/skills/)', value: 'AGENTS' as const },
  ];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{paint.bold('1/4')} {paint.primary('Variant 선택')}</Text>
      <Text>{paint.muted('진입 문서와 스킬 디렉터리 레이아웃만 다름. 스킬 내용은 동일.')}</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={(i) => onSelect(i.value)} />
      </Box>
    </Box>
  );
}
