# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenPeach is a modern terminal UI CLI framework built with Node.js, TypeScript, Ink, React, Chalk, Gradient-String, and Figlet. It provides:

1. **A TUI** (`openpeach` command) - Full-screen interactive terminal interface showing connection status, session stats, workspace context, and an interactive prompt
2. **A lightweight CLI** (`peach` command) - Hook management for Claude Code token optimization

The core feature is a **PostToolUse hook** that intercepts verbose tool output (Bash, Read, Grep) from Claude Code and truncates it intelligently, preserving important lines (errors, test failures, diff changes) while omitting verbose middle sections.

## Architecture

### Entry Points
- `src/index.tsx` - TUI entry point (renders React/Ink components)
- `src/cli.ts` - CLI entry point (Commander.js commands)

### Core Structure
```
src/
├── index.tsx           # TUI entry: render(<App />)
├── cli.ts              # CLI entry: Commander program with connect & hook commands
├── App.tsx             # Main TUI component composition
├── components/         # Ink React components (Banner, StatusLines, WorkspaceContext, etc.)
├── commands/           # CLI commands (connect.ts, hook-posttooluse.ts)
├── hooks/              # React hooks (useHookState.ts)
└── global.d.ts         # Global type declarations
```

### Key Components
- **Banner** - ASCII art "OPENPEACH" with sunset gradient
- **StatusLines** - Connection status, active interceptors, session ID, token savings
- **WorkspaceContext** - React context providing git info (branch, dirty state), hook connection state, session stats
- **PromptBox** - Interactive text input with `ink-text-input`
- **useHookState** - Hook that detects `.claude` directory, reads settings.json, polls session logs from `~/.openpeach/sessions/`

### Hook System (`src/commands/hook-posttooluse.ts`)
The PostToolUse hook:
1. Reads JSON payload from stdin (provided by Claude Code)
2. Triggers when output exceeds 2000 characters
3. Truncates using character budgets: head (1200 chars), tail (600 chars)
4. Preserves "anchor" lines matching error/failure patterns, diff changes, or diff headers with 2 lines context
4. Limits to 15 anchor blocks max
5. Returns truncated output via `hookSpecificOutput` to Claude Code
6. Logs interventions to `~/.openpeach/sessions/<session_id>.jsonl`

### Connect Command (`src/commands/connect.ts`)
- Finds/creates `.claude/settings.json` in current project
- Adds PostToolUse hook entry with matcher `Bash|Read|Grep` and command `peach hook posttooluse`
- Idempotent - safe to run multiple times

## Common Development Commands

```bash
# Install dependencies
npm install

# Run TUI in development mode
npm run dev

# Run CLI in development mode
npm run dev:cli

# Build for production (TypeScript compilation)
npm run build

# Type-check without emitting files
npm run typecheck

# Run the compiled TUI
node ./dist/index.js

# Run the compiled CLI
node ./dist/cli.js

# Run truncation validation tests
npm run test  # or: npx tsx test/validate-truncation.ts
```

## Testing

The test suite is in `test/validate-truncation.ts` with fixtures in `test/fixtures/`. It validates the truncation heuristic against various real-world outputs (test failures, git diffs, grep results, JSON dumps, build output).

Run tests:
```bash
npx tsx test/validate-truncation.ts
```

## Installation Methods

Users can install via:
- `npm install -g openpeach`
- `pnpm install -g openpeach`
- `yarn global add openpeach`
- `npx openpeach` (one-off)
- `curl -fsSL https://raw.githubusercontent.com/svanikhansh/OpenPeach/main/install.sh | sh`
- Windows: `irm https://raw.githubusercontent.com/svanikhansh/OpenPeach/main/install.ps1 | iex`

## Build Output

The `build` script compiles TypeScript to `dist/` and verifies the shebang in `dist/cli.js`. The `postbuild` step ensures the CLI entry point has the correct `#!/usr/bin/env node` shebang.

## Key Files to Know

- `src/commands/hook-posttooluse.ts` - Core truncation logic (most complex file)
- `src/hooks/useHookState.ts` - Session polling and connection detection
- `src/components/WorkspaceContext.tsx` - Git status and hook state context
- `test/validate-truncation.ts` - Validation harness for truncation behavior

## TypeScript Configuration

- Target: ES2022, Module: NodeNext
- JSX: react-jsx (for Ink components)
- Strict mode enabled
- Output: `dist/`, Root: `src/`
- Declaration files generated