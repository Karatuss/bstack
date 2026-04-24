import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/** Project vendor (복사): PROJECT/.claude/skills/bstack or .agents/skills/bstack */
export function installProjectVendor(
  bstackDir: string,
  projectDir: string,
  variant: 'CLAUDE' | 'AGENTS',
  selectedSkills: string[],
): { dest: string; copiedSkills: number; entryDoc: string } {
  const subdir = variant === 'CLAUDE' ? '.claude' : '.agents';
  const dest = path.resolve(projectDir, subdir, 'skills', 'bstack');
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  // Copy root (excluding .git, install/node_modules, .claude/worktrees)
  copyFiltered(bstackDir, dest);

  // Remove skills not selected
  const skillsRoot = path.join(dest, 'skills');
  if (fs.existsSync(skillsRoot)) {
    for (const entry of fs.readdirSync(skillsRoot)) {
      if (!selectedSkills.includes(entry)) {
        fs.rmSync(path.join(skillsRoot, entry), { recursive: true, force: true });
      }
    }
  }

  // Copy entry-doc template if project root lacks one
  const entryName = variant === 'CLAUDE' ? 'CLAUDE.md' : 'AGENTS.md';
  const entryTarget = path.join(projectDir, entryName);
  if (!fs.existsSync(entryTarget)) {
    const tmpl = path.join(bstackDir, 'templates', `${entryName}.template`);
    if (fs.existsSync(tmpl)) fs.copyFileSync(tmpl, entryTarget);
  }

  return { dest, copiedSkills: selectedSkills.length, entryDoc: entryTarget };
}

function copyFiltered(src: string, dest: string) {
  const skipNames = new Set(['.git', 'node_modules', 'worktrees']);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      try {
        const real = fs.readlinkSync(s);
        fs.symlinkSync(real, d);
      } catch {
        // ignore
      }
    } else if (entry.isDirectory()) {
      copyFiltered(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

export { copyFiltered as _copyFiltered };
export const _execSync = execSync; // reserved for future git ops
