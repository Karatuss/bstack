import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { paint } from '../theme.js';

export type InstallMode = 'global-symlink' | 'project-symlink' | 'project-vendor';

export function ModePicker({ onSelect }: { onSelect: (m: InstallMode) => void }) {
  const items = [
    { label: 'Global symlink   — ~/.claude/skills/bstack 로 전역 링크 (개발 중 즉시 반영)', value: 'global-symlink' as const },
    { label: 'Project symlink  — <project>/.claude/skills/bstack 또는 .agents/skills/bstack', value: 'project-symlink' as const },
    { label: 'Project vendor   — 선택한 스킬만 복사 (팀 공유·버전 고정)', value: 'project-vendor' as const },
  ];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{paint.bold('2/4')} {paint.primary('설치 모드')}</Text>
      <Text>{paint.muted('symlink: 원본 변경 즉시 반영 · vendor: 독립 사본')}</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={(i) => onSelect(i.value)} />
      </Box>
    </Box>
  );
}
