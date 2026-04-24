import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { paint } from '../theme.js';

export const ALL_SKILLS = [
  { name: 'brainstorming', group: '탐색' },
  { name: 'architect', group: '탐색' },
  { name: 'spec', group: '탐색' },
  { name: 'writing-plans', group: '탐색' },
  { name: 'subagent-driven', group: '탐색' },
  { name: 'conventions', group: '도메인' },
  { name: 'spring-core', group: '도메인' },
  { name: 'persistence', group: '도메인' },
  { name: 'api-review', group: '도메인' },
  { name: 'security', group: '도메인' },
  { name: 'test', group: '도메인' },
  { name: 'perf', group: '도메인' },
  { name: 'audit', group: '도메인' },
  { name: 'arch-guard', group: '도메인' },
  { name: 'collaboration', group: '협업/지표/관측' },
  { name: 'metrics', group: '협업/지표/관측' },
  { name: 'observability', group: '협업/지표/관측' },
  { name: 'investigate', group: '실패/릴리즈' },
  { name: 'writing-skills', group: '실패/릴리즈' },
  { name: 'ship', group: '실패/릴리즈' },
];

export function SkillPicker({ onSelect }: { onSelect: (skills: string[]) => void }) {
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(ALL_SKILLS.map((s) => s.name)),
  );

  useInput((input, key) => {
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    else if (key.downArrow) setCursor((c) => Math.min(ALL_SKILLS.length - 1, c + 1));
    else if (input === ' ') {
      const name = ALL_SKILLS[cursor].name;
      const next = new Set(selected);
      next.has(name) ? next.delete(name) : next.add(name);
      setSelected(next);
    } else if (input === 'a') {
      setSelected(new Set(ALL_SKILLS.map((s) => s.name)));
    } else if (input === 'n') {
      setSelected(new Set());
    } else if (key.return) {
      onSelect(Array.from(selected));
    }
  });

  let lastGroup = '';
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{paint.bold('3/4')} {paint.primary('스킬 선택')}  {paint.muted('Space=토글  a=전체  n=해제  Enter=확정')}</Text>
      <Text>{paint.muted(`선택: ${selected.size} / ${ALL_SKILLS.length}`)}</Text>
      <Box flexDirection="column" marginTop={1}>
        {ALL_SKILLS.map((s, i) => {
          const groupHeader = s.group !== lastGroup ? s.group : '';
          lastGroup = s.group;
          const marker = selected.has(s.name) ? paint.success('◉') : paint.muted('◯');
          const active = i === cursor;
          const line = `${marker} ${active ? paint.primary('▸ ') : '  '}${s.name}`;
          return (
            <React.Fragment key={s.name}>
              {groupHeader && (
                <Text>{'\n'}{paint.accent(`─ ${groupHeader} ─`)}</Text>
              )}
              <Text>{line}</Text>
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
}
