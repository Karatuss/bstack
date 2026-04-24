import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface SymlinkResult {
  created: string[];
  skipped: string[];
  replaced: string[];
}

/** Global symlink: ~/.claude/skills/bstack -> BSTACK_DIR + 개별 skill 링크 */
export function installGlobalSymlink(bstackDir: string, selectedSkills: string[]): SymlinkResult {
  const home = os.homedir();
  const skillsDir = path.join(home, '.claude', 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });

  const result: SymlinkResult = { created: [], skipped: [], replaced: [] };

  // Root harness link
  const rootTarget = path.join(skillsDir, 'bstack');
  replaceSymlink(rootTarget, bstackDir, result);

  // Individual skill links
  for (const name of selectedSkills) {
    const source = path.join(bstackDir, 'skills', name);
    if (!fs.existsSync(source)) continue;
    const link = path.join(skillsDir, name);
    replaceSymlink(link, source, result);
  }

  return result;
}

/** Project symlink: PROJECT/.claude/skills/bstack -> BSTACK_DIR (or .agents/) */
export function installProjectSymlink(
  bstackDir: string,
  projectDir: string,
  variant: 'CLAUDE' | 'AGENTS',
): SymlinkResult {
  const subdir = variant === 'CLAUDE' ? '.claude' : '.agents';
  const dest = path.resolve(projectDir, subdir, 'skills', 'bstack');
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const result: SymlinkResult = { created: [], skipped: [], replaced: [] };
  replaceSymlink(dest, bstackDir, result);
  return result;
}

function replaceSymlink(link: string, target: string, result: SymlinkResult) {
  try {
    const stat = fs.lstatSync(link);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(link);
      fs.symlinkSync(target, link);
      result.replaced.push(link);
      return;
    }
    result.skipped.push(link);
    return;
  } catch {
    // not existing
  }
  fs.symlinkSync(target, link);
  result.created.push(link);
}
