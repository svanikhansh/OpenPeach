# OpenPeach

A modern terminal UI CLI framework built with Node.js, TypeScript, Ink, React, Chalk, Gradient-String, and Figlet.

## Features

- Big ASCII banner with a sunset gradient
- Framed header and prompt box
- Status lines with colored connection dots
- Interactive text input with keyboard shortcuts
- Copilot-CLI-inspired layout
- **Token optimization hooks for Claude Code** — automatically truncates verbose tool output

## Installation

Install globally with npm:

```bash
npm install -g openpeach
```

With pnpm:

```bash
pnpm install -g openpeach
```

With yarn (v1):

```bash
yarn global add openpeach
```

Or run once with npx:

```bash
npx openpeach
```

Or install with curl:

```bash
curl -fsSL https://raw.githubusercontent.com/svanikhansh/OpenPeach/main/install.sh | sh
```

### Windows (PowerShell)

Install with PowerShell:

```powershell
irm https://raw.githubusercontent.com/svanikhansh/OpenPeach/main/install.ps1 | iex
```

Or install manually with npm:

```powershell
npm install -g openpeach
```

With pnpm:

```powershell
pnpm install -g openpeach
```

With yarn (v1):

```powershell
yarn global add openpeach
```

## Usage

After installing globally, you have two entry points:

- **TUI (full interface)** — start with `openpeach`:
  ```bash
  openpeach
  ```

- **CLI (hook management only)** — use `peach` for commands like `peach connect`:
  ```bash
  peach connect
  ```

The `peach` binary is a lightweight CLI for hook management (installs/updates `.claude/settings.json`), while `openpeach` launches the full TUI with live connection status, session stats, and token savings display.

### Connect Hooks to a Project

Run inside a Claude Code project to install the PostToolUse hook:

```bash
peach connect
```

This adds an entry to `.claude/settings.json` that intercepts `Bash`, `Read`, and `Grep` tool output and truncates responses over ~2000 characters.

The hook command is invoked automatically by Claude Code — you don't run it manually:

```bash
peach hook posttooluse
```

## Development

```bash
# Install dependencies
npm install

# Run TUI in development mode
npm run dev

# Run CLI in development mode
npm run dev:cli

# Build for production
npm run build

# Run the compiled TUI
node ./dist/index.js

# Run the compiled CLI
node ./dist/cli.js
```

## Commands

| Command | Description |
|---------|-------------|
| `peach connect` | Connect OpenPeach hooks to current project |
| `peach hook posttooluse` | PostToolUse hook handler (invoked by Claude Code) |

## Keyboard Shortcuts

- `Ctrl+C` — Exit
- `Ctrl+R` — Expand all (placeholder)

## Hook Mechanism

When `peach connect` runs, it adds a `PostToolUse` hook to `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash|Read|Grep",
        "hooks": [{ "type": "command", "command": "peach hook posttooluse" }]
      }
    ]
  }
}
```

When a matched tool runs in Claude Code and its output exceeds ~2000 characters:
1. The hook reads the JSON payload from stdin
2. Truncates to first 40 lines + last 20 lines with `[...N lines omitted...]` marker
3. Estimates tokens saved: `(original_chars - truncated_chars) / 4`
4. Logs intervention to `~/.openpeach/sessions/<session_id>.jsonl`
5. Returns truncated output to Claude Code via `hookSpecificOutput`

The TUI displays live stats: connection status, session ID, interventions count, and estimated tokens saved.

## Troubleshooting

### `openpeach` command not found

The global npm bin directory may not be in your PATH. Reload your shell or add:

```bash
# macOS/Linux
export PATH="$(npm config get prefix)/bin:$PATH"
```

```powershell
# Windows PowerShell
$env:PATH += ";$(npm config get prefix)"
```

### Node.js version error

OpenPeach requires Node.js 18 or later. Check your version:

```bash
node -v
```

Install or upgrade Node.js from [https://nodejs.org/](https://nodejs.org/).

### curl/wget not found (macOS/Linux installer)

The curl installer requires `curl` or `wget` for the GitHub tarball fallback. If both are missing, install one of them or use npm directly:

```bash
npm install -g openpeach
```

### Network or registry unreachable

If the npm registry is unreachable, the installer automatically falls back to installing from GitHub. If that also fails:

```bash
npm install -g github:svanikhansh/OpenPeach
```

### Windows execution policy error

If PowerShell blocks the installer with an execution-policy error, run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then re-run the installer.

### Install from source

If all else fails, clone the repository and build locally:

```bash
git clone https://github.com/svanikhansh/OpenPeach.git
cd OpenPeach
npm install
npm run build
npm install -g .
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
