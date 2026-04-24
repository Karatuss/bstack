import chalk from 'chalk';

export const theme = {
  primary: '#B794F4',
  accent: '#4FD1C5',
  muted: '#718096',
  success: '#48BB78',
  warning: '#F6AD55',
  danger: '#F56565',
};

export const paint = {
  primary: chalk.hex(theme.primary),
  accent: chalk.hex(theme.accent),
  muted: chalk.hex(theme.muted),
  success: chalk.hex(theme.success),
  warning: chalk.hex(theme.warning),
  danger: chalk.hex(theme.danger),
  bold: chalk.bold,
};
