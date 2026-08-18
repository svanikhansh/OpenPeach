import { program } from 'commander';
import { connectCommand } from './commands/connect.js';
import { hookPostToolUseCommand } from './commands/hook-posttooluse.js';

program
  .name('peach')
  .description('OpenPeach CLI - Token optimization for Claude Code')
  .version('0.0.1');

program.addCommand(connectCommand);
program.addCommand(hookPostToolUseCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});