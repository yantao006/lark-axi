export type OutputFormat = "compact" | "json";

export interface GlobalOptions {
  format: OutputFormat;
  full: boolean;
  debug: boolean;
  profile?: string;
  as?: "user" | "bot" | "auto";
  fields?: string[];
  limit?: number;
}

export interface CliResult {
  code: number;
  stdout: string;
  stderr?: string;
}

export interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

export interface CommandRunner {
  run(command: string, args: string[], options?: { timeoutMs?: number }): Promise<ProcessResult>;
  which?(command: string): Promise<string | undefined>;
}

export interface AxiError {
  code: string;
  message: string;
  help?: string;
  source: "wrapper" | "dependency" | "auth" | "scope" | "upstream_usage" | "upstream_service" | "timeout" | "unknown";
  retryable: boolean;
  fix: {
    action: string;
    command?: string;
    missing?: string[];
  };
  exitCode?: number;
  details?: Record<string, unknown>;
}

export interface RenderSection {
  name: string;
  rows?: Record<string, unknown>[];
  record?: Record<string, unknown>;
  text?: string;
  fields?: string[];
  empty?: string;
}

export interface RenderDocument {
  status?: "ok" | "error";
  command?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  sections: RenderSection[];
  nextActions?: string[];
  help?: string[];
  error?: AxiError;
}
