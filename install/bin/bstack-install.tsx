#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from '../src/App.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bstackDir = path.resolve(__dirname, '..', '..');

// --project=DIR 인자 파싱
let projectDir = process.cwd();
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--project=')) projectDir = path.resolve(arg.slice('--project='.length));
  else if (arg === '--project') projectDir = process.cwd();
}

render(<App bstackDir={bstackDir} projectDir={projectDir} />);
