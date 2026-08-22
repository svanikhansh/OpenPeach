import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

export interface ConnectResult {
  connected: boolean;
  alreadyConnected: boolean;
  message: string;
}

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

export async function connectProject(cwd = process.cwd()): Promise<ConnectResult> {
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
      return {
        connected: false,
        alreadyConnected: false,
        message: 'No .claude directory found. Run `claude init` or create .claude/ first.',
      };
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
      return {
        connected: true,
        alreadyConnected: true,
        message: 'OpenPeach hook is already connected in this project.',
      };
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

    return {
      connected: true,
      alreadyConnected: false,
      message: 'OpenPeach hook connected successfully. Start Claude Code to activate it.',
    };
}

export const connectCommand = new Command('connect')
  .description('Connect OpenPeach hooks to current Claude Code project')
  .action(async () => {
    const result = await connectProject();
    const output = result.connected ? chalk.green(result.message) : chalk.yellow(result.message);
    console.log(output);
    if (result.connected) {
      console.log(chalk.gray('  Matcher: Bash|Read|Grep'));
      console.log(chalk.gray('  Command: peach hook posttooluse'));
      console.log(chalk.gray('  Scope: Project-level (.claude/settings.json)'));
    } else {
      process.exitCode = 1;
    }
  });