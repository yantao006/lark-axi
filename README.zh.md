# lark-axi

[English](README.md)

面向 Agent 的 AXI 封装层，构建在官方 Lark/飞书 [`lark-cli`](https://github.com/larksuite/cli) 之上。

`lark-axi` 不重新实现飞书开放平台 API。它把实际调用委托给 `lark-cli`，并在外层提供更适合 Agent 使用的交互：紧凑输出、结构化错误、明确的空状态、截断提示、写操作安全闸门，以及未覆盖命令的 raw fallback。

[安装](#安装与快速开始) · [Agent 快速开始](#agent-快速开始) · [命令](#命令) · [输出](#输出模型) · [安全](#安全模型) · [开发](#开发)

## 为什么需要 lark-axi？

- **基于官方 CLI**：认证、权限范围、应用配置、Schema 覆盖、分页和平台行为仍由 `lark-cli` 负责。
- **面向 Agent 的默认输出**：默认输出更短、更稳定，适合 shell 型 Agent 快速读取上下文。
- **更安全的写操作**：受管写命令必须显式传入 `--dry-run` 或 `--execute`，并在调用 `lark-cli` 前校验必要参数。
- **渐进式覆盖**：优先封装高价值工作流，未覆盖能力仍可通过 `raw` 使用。
- **结构化失败**：依赖缺失、参数错误和上游错误会被整理成可预测的记录，而不是无边界 stderr。

## 与 lark-cli 的关系

官方 `lark-cli` 提供完整的飞书/Lark 命令体系：快捷命令、自动生成的 API 命令、Raw OpenAPI 调用、认证、Schema 探索和大量业务域。`lark-axi` 是它之上的轻量 Agent 执行层。

需要以下能力时，直接使用 `lark-cli`：

- 完整上游命令覆盖。
- 官方工具的原始输出。
- 交互式初始化、登录、权限选择或 Schema 探索。
- 尚未被 `lark-axi` 建模的高级上游参数。

需要以下能力时，使用 `lark-axi`：

- 精简的身份、日历、消息、文档、任务、表格、多维表格或云盘上下文。
- 发送消息、创建文档前的受控预览。
- 对任意 `lark-cli` 命令进行紧凑 fallback。

## 安装与快速开始

### 环境要求

- Node.js 20+
- `lark-cli` 已安装并在 `PATH` 中可用
- Lark/飞书应用配置和登录状态由 `lark-cli` 管理

安装或更新官方 CLI：

```bash
npx @larksuite/cli@latest install
```

配置并登录：

```bash
lark-cli config init
lark-cli auth login --recommend
lark-cli auth status
```

从当前仓库安装 `lark-axi` 用于本地开发：

```bash
git clone https://github.com/yantao006/lark-axi.git
cd lark-axi
npm install
npm run build
npm link
```

验证：

```bash
lark-axi
lark-axi auth status
```

如果 `lark-cli` 不在 `PATH` 中，可以显式指定路径：

```bash
export LARK_CLI_PATH=/absolute/path/to/lark-cli
lark-axi
```

## Agent 快速开始

Agent 在 shell 会话中可按以下顺序使用：

```bash
# 1. 查看运行时、认证摘要和已发现业务域
lark-axi

# 2. 在读写数据前确认当前身份
lark-axi auth status

# 3. 读取精简上下文
lark-axi calendar agenda
lark-axi im search --query "project update"
lark-axi docs fetch --token <doc-token>

# 4. 写操作先预览
lark-axi im send --chat-id oc_xxx --text "hello" --dry-run
lark-axi docs create --title "Weekly" --content "# Progress" --dry-run
```

`lark-axi` 不会自动发起登录。如果认证缺失，应让用户执行：

```bash
lark-cli auth login --recommend
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `lark-axi` | 显示运行时、认证摘要、已发现业务域和下一步提示。 |
| `lark-axi auth status` | 显示精简身份状态。 |
| `lark-axi calendar agenda` | 列出即将到来的日程。 |
| `lark-axi im search --query <text>` | 搜索消息。 |
| `lark-axi im send --chat-id <oc_xxx> --text <text> --dry-run\|--execute` | 预览或发送消息。 |
| `lark-axi docs fetch --token <token>` | 获取文档预览。 |
| `lark-axi docs create --title <title> --content <markdown> --dry-run\|--execute` | 预览或创建文档。 |
| `lark-axi drive search` | 通过通用读取逻辑委托云盘搜索。 |
| `lark-axi base records` | 通过通用读取逻辑委托多维表格记录列表。 |
| `lark-axi sheets info` | 查看电子表格元数据。 |
| `lark-axi task list` | 列出分配给当前身份的任务。 |
| `lark-axi raw <lark-cli args...>` | 将未覆盖操作委托给 `lark-cli`。 |

IM ID 说明：

- `chat_id` 表示群聊或单聊会话，前缀是 `oc_`。
- `message_id` 前缀是 `om_`；发送者用户 ID 前缀通常是 `ou_`；应用 ID 前缀是 `cli_`。
- 用 `lark-axi im search --query "hello"` 可以在匹配消息里看到 `chat_id`。
- 用 `lark-axi raw im +chat-search --query "project"` 或 `lark-axi raw im +chat-list --types group,p2p` 可以直接查找会话。

全局参数：

| 参数 | 说明 |
| --- | --- |
| `--format json` | 以结构化 JSON 输出 `lark-axi` 响应。 |
| `--full` | 关闭文本截断。 |
| `--fields a,b,c` | 只保留指定字段。 |
| `--limit N` | 限制行数。 |
| `--profile <name>` | 在支持时转发 `lark-cli` profile。 |
| `--as user\|bot\|auto` | 在支持时转发身份选择。 |
| `--debug` | 本地调试时在 stderr 输出堆栈。 |

使用 `raw` 时，wrapper 参数要放在 `raw` 前：

```bash
lark-axi --format json raw auth status
```

`raw` 后面的参数会原样转发给 `lark-cli`：

```bash
lark-axi raw api GET /open-apis/calendar/v4/calendars
```

## 输出模型

默认输出是为 Agent 消费优化的紧凑格式。它会有意摘要大型上游 payload，而不是复刻 `lark-cli` 的每一个字段。

示例：

```bash
lark-axi auth status
```

```text
auth:
  brand: feishu
  identity: user
  default_as: auto
  user: 示例用户
  note: ""
```

需要精确字段时使用 JSON：

```bash
lark-axi --format json auth status
```

需要官方工具原始输出时，直接使用：

```bash
lark-cli auth status
```

## 命令覆盖

`lark-axi` 采用三层实用模型：

1. **受管封装**：面向常见 Agent 工作流的稳定、紧凑命令。
2. **通用读取**：对云盘、多维表格、电子表格、任务等常用读取路径做轻量委托。
3. **Raw fallback**：对尚未建模的能力，委托执行任意 `lark-cli` 命令。

当前覆盖表见 [docs/capabilities.md](docs/capabilities.md)。

## 安全模型

`lark-axi` 通过 `lark-cli` 执行，因此操作会使用 `lark-cli` 当前配置的身份和权限范围。

默认策略：

- 不自动执行登录。
- 在鼓励操作前展示当前身份状态。
- 受管写操作必须使用 `--dry-run` 或 `--execute`。
- 调用 `lark-cli` 前先校验必要写入参数。
- 除非启用 `--debug`，否则依赖 stderr 不混入 stdout。
- 优先使用紧凑预览，再按需获取完整内容。

更多说明见 [docs/security.md](docs/security.md)。

## 开发

```bash
npm install
npm run build
npm test
npm run skill:check
```

从源码运行 CLI：

```bash
npm run dev -- --help
npm run dev -- auth status
```

生成内置 Agent Skill：

```bash
npm run skill:generate
```

运行完整本地检查：

```bash
npm run check
```

## 许可

MIT。

使用 `lark-axi` 时也会使用 `lark-cli` 和 Lark/飞书开放平台 API。请确保你的使用方式符合相关 Lark/飞书条款、隐私政策以及所在组织的权限规则。
