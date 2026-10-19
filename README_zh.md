# SciDraw MCP

> **⚠ 非官方项目：** 这是一个**社区维护的非官方** MCP 服务器，与 [SciDraw.io](https://scidraw.io) 或其维护者没有任何隶属、认可或官方关联关系。所有插图数据和内容均由 SciDraw.io 提供和所有。

> 适配 [SciDraw.io](https://scidraw.io) 数据库的 MCP（模型上下文协议）服务器，提供科学插图的搜索、浏览与下载功能。

**English** | [中文文档](./README_zh.md)

---

## 项目简介

**SciDraw.io** 是一个免费、开放的高质量科学插图库，为学术论文、海报和演示文稿提供插图资源。所有插图均采用知识共享许可（CC-BY 4.0 或 CC0），可免费使用和二次创作。

**SciDraw MCP** 是一个模型上下文协议（MCP）服务器，将 SciDraw 的公开 REST API 封装为一组工具，供 AI 助手（如 Claude、Cursor 及其他兼容 MCP 的客户端）直接调用。你可以通过自然语言对话来搜索科学插图、查看元数据、下载图片文件——一切都在 AI 助手中完成。

### 核心功能

- **🔍 搜索插图** — 支持按关键词、分类、作者、文件类型和排序方式进行搜索。
- **📋 查看详情** — 获取任意插图的完整元数据，包括所有作者、DOI、文件大小和许可证信息。
- **⬇️ 下载文件** — 下载实际的 SVG/PNG 图片文件，以可查看的图片资源形式返回。
- **🏷️ 浏览分类** — 列出所有插图分类及其包含的插图数量。

### 提供的工具

| 工具名称 | 描述 |
|---------|------|
| `search_drawings` | 按关键词、分类、作者、文件类型和排序方式搜索科学插图，返回分页结果。 |
| `get_drawing` | 根据插图的 slug 标识符获取其详细元数据（包括所有作者、DOI、文件大小、许可证等）。 |
| `download_drawing` | 下载插图的图片文件（SVG 或 PNG 格式），以可显示的图片资源形式返回。 |
| `list_categories` | 列出 SciDraw 上所有可用的插图分类及其插图数量。 |

---

## 快速开始

### 环境要求

- **Node.js ≥ 18.0.0**（需要内置 `fetch` 支持）
- 一个兼容 MCP 的客户端（如 [Claude Desktop](https://claude.ai/download)、[Cursor](https://cursor.sh) 或其他 MCP 客户端）

### 安装方式

#### 方式一：通过 npx 直接运行（推荐）

无需安装——`npx` 会自动获取并运行服务器：

```bash
npx scidraw-mcp
```

#### 方式二：全局安装

```bash
npm install -g scidraw-mcp
scidraw-mcp
```

#### 方式三：从源码构建

```bash
git clone https://github.com/scidraw-mcp/scidraw-mcp.git
cd scidraw-mcp
npm install
npm run build
node dist/index.js
```

---

## 配置方法

### Claude Desktop 配置

将以下内容添加到 Claude Desktop 的配置文件中：

- **macOS：** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows：** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "scidraw": {
      "command": "npx",
      "args": ["scidraw-mcp"]
    }
  }
}
```

如果已全局安装：

```json
{
  "mcpServers": {
    "scidraw": {
      "command": "scidraw-mcp"
    }
  }
}
```

如果从源码构建：

```json
{
  "mcpServers": {
    "scidraw": {
      "command": "node",
      "args": ["/path/to/scidraw-mcp/dist/index.js"]
    }
  }
}
```

### Cursor 配置

在 Cursor 的 MCP 设置中添加（`设置 → MCP`）：

```json
{
  "mcpServers": {
    "scidraw": {
      "command": "npx",
      "args": ["scidraw-mcp"]
    }
  }
}
```

### 其他 MCP 客户端

本服务器使用 **stdio 传输协议**，这是标准的 MCP 传输方式。任何支持 stdio 传输的 MCP 兼容客户端都可以连接。启动服务器：

```bash
npx scidraw-mcp
```

---

## 使用示例

连接 AI 助手后，你可以使用自然语言与 SciDraw 交互：

### 示例 1：搜索插图

> "在 SciDraw 上搜索大脑（brain）相关的插图"

AI 助手将调用 `search_drawings` 工具，参数为 `search: "brain"`，返回匹配的插图列表及其元数据。

### 示例 2：按分类浏览

> "给我看看 SciDraw 上所有小鼠（mouse）的插图"

AI 助手将调用 `search_drawings` 工具，参数为 `category: "mouse"`。

### 示例 3：获取特定插图的详情

> "获取 slug 为 'mouse-ded16e1d' 的插图的详细信息"

AI 助手将调用 `get_drawing` 工具，返回包括作者、DOI、文件大小和许可证在内的完整元数据。

### 示例 4：下载插图

> "下载那个小鼠插图"

AI 助手将调用 `download_drawing` 工具，以可显示的图片形式返回 SVG 文件。

### 示例 5：列出分类

> "SciDraw 上有哪些分类？"

AI 助手将调用 `list_categories` 工具，返回所有分类及其插图数量。

---

## API 参考

### SciDraw API 说明

本服务器封装了 SciDraw 公开 REST API（地址：`https://scidraw.io/api/v1/`）。使用的端点如下：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/drawings/` | GET | 搜索/列出插图，支持筛选（search、category、is_vector、ordering、author、image_type、cursor） |
| `/api/v1/drawings/{slug}/` | GET | 获取特定插图的详细信息 |
| `/api/v1/drawings/{slug}/download/` | GET | 下载插图的图片文件 |
| `/api/v1/categories/` | GET | 列出所有插图分类 |

### 分类说明

SciDraw 将插图组织为以下分类：

| 分类 | Slug | 描述 |
|------|------|------|
| 小鼠 | `mouse` | 小鼠相关插图 |
| 大鼠 | `rat` | 大鼠相关插图 |
| 鱼类 | `fish` | 鱼类（包括斑马鱼） |
| 果蝇 | `drosophila` | 果蝇 |
| 人类 | `human` | 人体解剖 |
| 鸟类 | `bird` | 鸟类插图 |
| 细胞 | `cell` | 细胞生物学 |
| 其他 | `other` | 其他科学插图 |

### 排序方式

搜索时可选择以下排序方式：

| 排序方式 | 描述 |
|---------|------|
| `downloads` | 按下载量排序（最多下载优先，默认） |
| `newest` | 按时间排序（最新优先） |
| `name` | 按名称排序（A-Z 字母顺序） |

---

## 项目结构

```
scidraw-mcp/
├── src/
│   ├── index.ts        # 服务器入口 — 创建并启动 MCP 服务器
│   ├── client.ts       # SciDraw API 客户端（fetch 封装）
│   ├── tools.ts        # MCP 工具定义与处理函数
│   └── types.ts        # API 响应的 TypeScript 类型定义
├── package.json        # 项目配置与依赖
├── tsconfig.json       # TypeScript 编译配置
├── LICENSE             # MIT 许可证
├── README.md           # 英文文档
└── README_zh.md        # 中文文档（本文件）
```

---

## 开发指南

### 构建

```bash
npm run build
```

### 开发模式运行

```bash
npm run dev    # 监听模式 — 文件变更时自动重新构建
```

### 手动测试

启动服务器并通过标准输入发送 MCP 消息（用于调试）：

```bash
npm run build && node dist/index.js
```

---

## 许可证说明

### 本 MCP 服务器

本项目采用 **MIT 许可证**。详情请参阅 [LICENSE](./LICENSE)。

> **注意：** 这是一个非官方的、社区维护的项目，与 SciDraw.io 没有任何隶属或认可关系。

### SciDraw 插图

通过本工具访问的所有插图由 [SciDraw.io](https://scidraw.io) 托管，采用以下许可证：

- **知识共享署名 4.0**（CC-BY 4.0）— 大多数插图
- **知识共享零许可**（CC0）— 部分插图

使用下载的插图时，请注意：

1. **引用作者** — 使用每张插图提供的 DOI 进行引用。
2. **致谢 SciDraw.io** — 在你的作品中包含 SciDraw 的标志。
3. **尊重许可证** — CC-BY 要求署名；CC0 不要求。

更多信息请参阅 [SciDraw 的许可说明页面](https://scidraw.io/about)。

---

## 致谢

- **[SciDraw.io](https://scidraw.io)** — 感谢这个开放的科学插图库，使本 MCP 服务器成为可能。由 [Alex Harston](https://buymeacoffee.com/alexharston) 创建和维护。
- **[模型上下文协议](https://modelcontextprotocol.io)** — 感谢该协议规范，使 AI 助手能够与外部工具交互。
- 感谢所有为 SciDraw 贡献插图的**科学家和插画师**们。

---

## 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 提交 Pull Request

---

## 常见问题排查

### 服务器无法启动

- 确保已安装 Node.js ≥ 18：`node --version`
- 如果使用 `npx`，尝试清除 npx 缓存：`npx clear-npx-cache`
- 如果从源码构建，确保依赖已安装：`npm install`

### Claude Desktop 连接问题

- 编辑配置文件后重启 Claude Desktop
- 检查日志：`~/Library/Logs/Claude/mcp-server-scidraw.log`（macOS）
- 确认服务器路径正确（使用绝对路径）

### API 错误

- SciDraw API 是公共服务，偶尔可能不可用
- 检查你的网络连接
- 如果收到 HTTP 429（请求过多），请稍等片刻后重试
