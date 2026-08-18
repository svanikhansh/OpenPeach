// Type declarations for Node.js globals
declare namespace NodeJS {
  interface Process {
    cwd(): string;
    exit(code?: number): never;
    stdin: ReadableStream;
    stdout: WritableStream;
    stderr: WritableStream;
    argv: string[];
    env: Record<string, string | undefined>;
    version: string;
    versions: Record<string, string>;
  }

  interface ReadableStream {
    [Symbol.asyncIterator](): AsyncIterator<Buffer>;
  }

  interface WritableStream {
    write(chunk: string | Buffer, callback?: (error?: Error | null) => void): boolean;
  }

  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

declare const process: NodeJS.Process;
declare const console: Console;

declare function setInterval(callback: (...args: unknown[]) => void, ms: number, ...args: unknown[]): NodeJS.Timeout;
declare function clearInterval(id: NodeJS.Timeout): void;

// Module declarations
declare module 'fs' {
  export interface Stats {
    isDirectory(): boolean;
    mtimeMs: number;
  }
  export function stat(path: string): Promise<Stats>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
  export function writeFile(path: string, data: string): Promise<void>;
  export function appendFile(path: string, data: string): Promise<void>;
  export function readdir(path: string): Promise<string[]>;
  export const promises: {
    stat(path: string): Promise<Stats>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    readFile(path: string, encoding: 'utf8'): Promise<string>;
    writeFile(path: string, data: string): Promise<void>;
    appendFile(path: string, data: string): Promise<void>;
    readdir(path: string): Promise<string[]>;
  };
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function parse(path: string): { root: string; dir: string; base: string; ext: string; name: string };
}

declare module 'os' {
  export function homedir(): string;
}

declare module 'child_process' {
  export function execFileSync(
    command: string,
    args: string[],
    options: { cwd: string; encoding: string; stdio: string[] }
  ): string;
}