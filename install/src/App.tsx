import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Welcome } from './steps/Welcome.js';
import { VariantPicker, Variant } from './steps/VariantPicker.js';
import { ModePicker, InstallMode } from './steps/ModePicker.js';
import { SkillPicker } from './steps/SkillPicker.js';
import { Summary, InstallConfig } from './steps/Summary.js';
import { paint } from './theme.js';
import { installGlobalSymlink, installProjectSymlink } from './lib/symlink.js';
import { installProjectVendor } from './lib/vendor.js';

type Step = 'welcome' | 'variant' | 'mode' | 'skills' | 'summary' | 'running' | 'done' | 'canceled';

export function App({ bstackDir, projectDir }: { bstackDir: string; projectDir: string }) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [variant, setVariant] = useState<Variant>('CLAUDE');
  const [mode, setMode] = useState<InstallMode>('global-symlink');
  const [skills, setSkills] = useState<string[]>([]);
  const [resultLines, setResultLines] = useState<string[]>([]);

  const run = () => {
    setStep('running');
    const lines: string[] = [];
    try {
      if (mode === 'global-symlink') {
        const r = installGlobalSymlink(bstackDir, skills);
        lines.push(`created: ${r.created.length}, replaced: ${r.replaced.length}, skipped: ${r.skipped.length}`);
        lines.push(...r.created.slice(0, 5).map((p) => `  + ${p}`));
      } else if (mode === 'project-symlink') {
        const r = installProjectSymlink(bstackDir, projectDir, variant);
        lines.push(`linked: ${r.created.concat(r.replaced).join(', ') || '(none)'}`);
      } else {
        const r = installProjectVendor(bstackDir, projectDir, variant, skills);
        lines.push(`vendor: ${r.dest}`);
        lines.push(`skills: ${r.copiedSkills}`);
        lines.push(`entry:  ${r.entryDoc}`);
      }
      setResultLines(lines);
      setStep('done');
      setTimeout(() => exit(), 1200);
    } catch (err: any) {
      setResultLines([`ERROR: ${err.message}`]);
      setStep('done');
      setTimeout(() => exit(1), 1500);
    }
  };

  if (step === 'welcome') return <Welcome onContinue={() => setStep('variant')} />;
  if (step === 'variant') {
    return <VariantPicker onSelect={(v) => { setVariant(v); setStep('mode'); }} />;
  }
  if (step === 'mode') {
    return <ModePicker onSelect={(m) => { setMode(m); setStep('skills'); }} />;
  }
  if (step === 'skills') {
    return <SkillPicker onSelect={(list) => { setSkills(list); setStep('summary'); }} />;
  }
  if (step === 'summary') {
    const cfg: InstallConfig = {
      variant,
      mode,
      skills,
      projectDir: mode === 'global-symlink' ? undefined : projectDir,
    };
    return <Summary config={cfg} onConfirm={run} onCancel={() => { setStep('canceled'); exit(); }} />;
  }
  if (step === 'running') {
    return <Box paddingX={1}><Text>{paint.accent('⠋')} 설치 진행 중…</Text></Box>;
  }
  if (step === 'done') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text>{paint.success('✔ 설치 완료')}</Text>
        {resultLines.map((l, i) => <Text key={i}>{paint.muted(l)}</Text>)}
        <Box marginTop={1}>
          <Text>{paint.muted('다음: /bstack 으로 하네스 진입')}</Text>
        </Box>
      </Box>
    );
  }
  return <Text>{paint.warning('취소됨')}</Text>;
}
