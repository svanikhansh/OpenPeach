import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

interface SettingsFile {
  hooks?: {
    PostToolUse?: Array<{
      matcher: string;
      hooks: Array<{
        type: string;
        command: string;
      }>;
    }>;
  };
}

export const connectCommand = new Command('connect')
  .description('Connect OpenPeach hooks to current Claude Code project')
  .action(async () => {
    const cwd = process.cwd();
    const claudeDir = path.join(cwd, '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');

    // Check if .claude directory exists
    let hasClaudeDir = false;
    try {
      const stat = await fs.stat(claudeDir);
      hasClaudeDir = stat.isDirectory();
    } catch {
      hasClaudeDir = false;
    }

    if (!hasClaudeDir) {
      console.log(chalk.yellow('No .claude directory found in current project.'));
      console.log(chalk.gray('Run `claude init` or create .claude/ manually, then run `peach connect` again.'));
      process.exit(1);
    }

    // Read existing settings or create new
    let settings: SettingsFile = {};
    try {
      const content = await fs.readFile(settingsPath, 'utf8');
      settings = JSON.parse(content);
    } catch {
      settings = {};
    }

    // Initialize hooks structure if needed
    if (!settings.hooks) settings.hooks = {};
    if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];

    // Check if our hook already exists
    const ourMatcher = 'Bash|Read|Grep';
    const ourCommand = 'peach hook posttooluse';

    const existingEntry = settings.hooks.PostToolUse.find(
      (entry) => entry.matcher === ourMatcher
    );

    let alreadyConnected = false;
    if (existingEntry) {
      const hasOurHook = existingEntry.hooks.some(
        (h) => h.type === 'command' && h.command === ourCommand
      );
      if (hasOurHook) {
        alreadyConnected = true;
      }
    }

    if (alreadyConnected) {
      console.log(chalk.green('✓ OpenPeach hook already connected in this project.'));
      console.log(chalk.gray(`  Matcher: ${ourMatcher}`));
      console.log(chalk.gray(`  Command: ${ourCommand}`));
      console.log(chalk.gray(`  Scope: Project-level (.claude/settings.json)`));
      return;
    }

    // Add our hook entry
    if (existingEntry) {
      // Merge into existing matcher entry
      existingEntry.hooks.push({ type: 'command', command: ourCommand });
    } else {
      // Create new matcher entry
      settings.hooks.PostToolUse.push({
        matcher: ourMatcher,
        hooks: [{ type: 'command', command: ourCommand }],
      });
    }

    // Write back settings
    await fs.mkdir(claudeDir, { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    console.log(chalk.green('✓ OpenPeach hook connected successfully!'));
    console.log(chalk.gray(`  Matcher: ${ourMatcher}`));
    console.log(chalk.gray(`  Command: ${ourCommand}`));
    console.log(chalk.gray(`  Scope: Project-level (.claude/settings.json)`));
    console.log();
    console.log(chalk.gray('Start Claude Code in this project to activate the hook.'));
  });