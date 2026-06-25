export type CommandStatus = "curated" | "generic" | "raw-only" | "deprecated" | "unsupported";
export type RiskClass = "read" | "write" | "destructive" | "permission" | "external-send" | "file-system" | "long-running";

export interface UpstreamCommand {
  args: string[];
  supportsFormat?: boolean;
}

export interface CommandDefinition {
  key: string;
  description: string;
  usage: string;
  flags: string;
  examples: string;
  status: CommandStatus;
  risk: RiskClass;
  upstream?: UpstreamCommand;
  requiredFlags?: string[];
  defaultFields?: string[];
  empty?: string;
  aliases?: string[];
}

const COMMANDS: CommandDefinition[] = [
  {
    key: "auth status",
    description: "Show lark-cli auth state",
    usage: "lark-axi auth status [--format json]",
    flags: "--format json; --profile <name>; --as user|bot",
    examples: "lark-axi auth status",
    status: "curated",
    risk: "read"
  },
  {
    key: "auth scopes",
    description: "List scopes enabled for the current app",
    usage: "lark-axi auth scopes [--format json]",
    flags: "--format json; --profile <name>",
    examples: "lark-axi auth scopes",
    status: "generic",
    risk: "read",
    upstream: { args: ["auth", "scopes"], supportsFormat: true },
    empty: "0 auth scopes found"
  },
  {
    key: "auth users",
    description: "List logged-in users",
    usage: "lark-axi auth users [--format json]",
    flags: "--format json; --profile <name>",
    examples: "lark-axi auth users",
    status: "generic",
    risk: "read",
    upstream: { args: ["auth", "list"], supportsFormat: true },
    empty: "0 logged-in users found"
  },
  {
    key: "doctor",
    description: "Run local lark-cli health checks",
    usage: "lark-axi doctor [--format json]",
    flags: "--format json; --profile <name>",
    examples: "lark-axi doctor",
    status: "generic",
    risk: "read",
    upstream: { args: ["doctor"], supportsFormat: true },
    empty: "0 doctor checks returned"
  },
  {
    key: "calendar agenda",
    description: "List upcoming calendar events",
    usage: "lark-axi calendar agenda [--limit N] [--fields a,b,c]",
    flags: "--limit N; --fields summary,start_time,end_time,calendar_id; --format json",
    examples: "lark-axi calendar agenda\nlark-axi calendar agenda --limit 50",
    status: "curated",
    risk: "read",
    defaultFields: ["summary", "start_time", "end_time", "calendar_id"],
    empty: "0 upcoming calendar events"
  },
  {
    key: "im search",
    description: "Search messages",
    usage: "lark-axi im search --query <text> [--limit N] [--fields a,b,c]",
    flags: "--query <text> required; --limit N; --fields chat_id,message_id,sender,text,create_time",
    examples: "lark-axi im search --query \"project update\"\nlark-axi im search --query \"release\" --fields chat_id,message_id,text",
    status: "curated",
    risk: "read",
    requiredFlags: ["query"],
    defaultFields: ["chat_id", "message_id", "sender", "text", "create_time"],
    empty: "0 messages found"
  },
  {
    key: "im chats",
    description: "List visible chats",
    usage: "lark-axi im chats [lark-cli flags] [--limit N]",
    flags: "--types=p2p,group; --limit N; --fields a,b,c",
    examples: "lark-axi im chats --types group,p2p",
    status: "generic",
    risk: "read",
    upstream: { args: ["im", "+chat-list"], supportsFormat: true },
    defaultFields: ["chat_id", "name", "chat_mode", "owner_id"],
    empty: "0 chats found"
  },
  {
    key: "im chat-search",
    description: "Search visible group chats",
    usage: "lark-axi im chat-search --query <text> [--limit N]",
    flags: "--query <text> required; --limit N; --fields a,b,c",
    examples: "lark-axi im chat-search --query \"project\"",
    status: "generic",
    risk: "read",
    requiredFlags: ["query"],
    upstream: { args: ["im", "+chat-search"], supportsFormat: true },
    defaultFields: ["chat_id", "name", "description", "owner_id"],
    empty: "0 chats found"
  },
  {
    key: "im send",
    description: "Preview or send a text, markdown, media, or raw content message",
    usage: "lark-axi im send --chat-id <oc_xxx> --text <text> --dry-run|--execute",
    flags: "--chat-id or --user-id required; one of --text, --markdown, --content, --image, --file, --video, or --audio required; exactly one of --dry-run or --execute",
    examples:
      "lark-axi im send --chat-id oc_xxx --text \"hello\" --dry-run\nlark-axi im send --chat-id oc_xxx --markdown \"# hello\" --dry-run\nHint: find chat IDs with `lark-axi im chats` or `lark-axi im chat-search --query \"project\"`",
    status: "curated",
    risk: "external-send",
    requiredFlags: ["chat-id|user-id", "text|markdown|content|image|file|video|audio"],
    upstream: { args: ["im", "+messages-send"], supportsFormat: true }
  },
  {
    key: "docs fetch",
    description: "Fetch a document preview",
    usage: "lark-axi docs fetch --token <doc-token> [--format json]",
    flags: "--token <doc-token> required; --full to avoid truncation",
    examples: "lark-axi docs fetch --token doc_xxx",
    status: "curated",
    risk: "read",
    requiredFlags: ["token"]
  },
  {
    key: "docs search",
    description: "Search docs through lark-cli",
    usage: "lark-axi docs search --query <text> [--limit N]",
    flags: "--query <text> required; --limit N; --fields a,b,c",
    examples: "lark-axi docs search --query \"roadmap\"",
    status: "generic",
    risk: "read",
    requiredFlags: ["query"],
    upstream: { args: ["docs", "+search"], supportsFormat: true },
    defaultFields: ["title", "url", "doc_token", "owner"],
    empty: "0 docs found"
  },
  {
    key: "docs create",
    description: "Preview or create a document",
    usage: "lark-axi docs create --title <title> --content <markdown> --dry-run|--execute",
    flags: "--title and --content required; exactly one of --dry-run or --execute",
    examples: "lark-axi docs create --title \"Weekly\" --content \"# Progress\" --dry-run",
    status: "curated",
    risk: "write",
    requiredFlags: ["title", "content"]
  },
  {
    key: "drive search",
    description: "Search Drive files",
    usage: "lark-axi drive search --query <text> [--limit N]",
    flags: "--query <text>; --limit N; --fields a,b,c",
    examples: "lark-axi drive search --query \"planning\"",
    status: "generic",
    risk: "read",
    requiredFlags: ["query"],
    upstream: { args: ["drive", "+search"], supportsFormat: true },
    defaultFields: ["title", "type", "url", "token", "owner"],
    empty: "0 drive files found"
  },
  {
    key: "drive inspect",
    description: "Inspect Drive file metadata",
    usage: "lark-axi drive inspect --url <url>|--token <token>",
    flags: "--url, --token, --file-token, or --folder-token; --fields a,b,c",
    examples: "lark-axi drive inspect --url https://example.feishu.cn/docx/xxx",
    status: "generic",
    risk: "read",
    requiredFlags: ["url|token|file-token|folder-token"],
    upstream: { args: ["drive", "+inspect"], supportsFormat: true },
    defaultFields: ["title", "type", "token", "url", "owner"],
    empty: "0 drive metadata rows"
  },
  {
    key: "base records",
    description: "List Base records",
    usage: "lark-axi base records [lark-cli flags] [--limit N]",
    flags: "Forwards table/app flags to lark-cli; --limit N; --fields a,b,c",
    examples: "lark-axi base records --app-token bas_xxx --table-id tbl_xxx",
    status: "generic",
    risk: "read",
    upstream: { args: ["base", "+record-list"], supportsFormat: true },
    empty: "0 base records found"
  },
  {
    key: "sheets info",
    description: "Show spreadsheet workbook metadata",
    usage: "lark-axi sheets info [lark-cli flags]",
    flags: "Forwards spreadsheet flags to lark-cli; --fields a,b,c",
    examples: "lark-axi sheets info --spreadsheet-token sht_xxx",
    status: "generic",
    risk: "read",
    upstream: { args: ["sheets", "+workbook-info"], supportsFormat: true },
    empty: "0 spreadsheet metadata rows"
  },
  {
    key: "task list",
    description: "List current user's tasks",
    usage: "lark-axi task list [--limit N]",
    flags: "--limit N; --fields a,b,c",
    examples: "lark-axi task list --limit 10",
    status: "generic",
    risk: "read",
    upstream: { args: ["task", "+get-my-tasks"], supportsFormat: true },
    defaultFields: ["guid", "summary", "completed_at", "due"],
    empty: "0 tasks found"
  },
  {
    key: "contact search",
    description: "Search users by name or email",
    usage: "lark-axi contact search --query <text> [--limit N]",
    flags: "--query <text> required; --limit N; --fields a,b,c",
    examples: "lark-axi contact search --query \"Alice\"",
    status: "generic",
    risk: "read",
    requiredFlags: ["query"],
    upstream: { args: ["contact", "+search-user"], supportsFormat: true },
    defaultFields: ["open_id", "name", "email", "department"],
    empty: "0 contacts found"
  },
  {
    key: "markdown fetch",
    description: "Fetch a Lark document as Markdown",
    usage: "lark-axi markdown fetch [lark-cli flags]",
    flags: "Forwards markdown fetch flags to lark-cli",
    examples: "lark-axi markdown fetch --url https://example.feishu.cn/docx/xxx",
    status: "generic",
    risk: "read",
    upstream: { args: ["markdown", "+fetch"], supportsFormat: false },
    empty: "0 markdown rows"
  },
  {
    key: "raw",
    description: "Pass through to lark-cli for commands not yet wrapped",
    usage: "lark-axi raw <lark-cli args...>",
    flags: "Wrapper flags must appear before raw; flags after raw pass to lark-cli",
    examples: "lark-axi raw api GET /open-apis/calendar/v4/calendars\nlark-axi --format json raw auth status",
    status: "raw-only",
    risk: "read"
  }
];

const BY_KEY = new Map(COMMANDS.flatMap((command) => [[command.key, command], ...(command.aliases ?? []).map((alias) => [alias, command] as const)]));

export function allCommands(): CommandDefinition[] {
  return COMMANDS;
}

export function findCommand(key: string): CommandDefinition | undefined {
  return BY_KEY.get(key);
}

export function displayCommands(): CommandDefinition[] {
  return COMMANDS.filter((command) => command.status !== "deprecated" && command.status !== "unsupported");
}

export function isMutationRisk(risk: RiskClass): boolean {
  return risk !== "read" && risk !== "long-running";
}
