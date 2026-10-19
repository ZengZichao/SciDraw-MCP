# SciDraw MCP

> **⚠ Non-official project:** This is a **community-maintained, unofficial** MCP server and is not affiliated with, endorsed by, or officially associated with [SciDraw.io](https://scidraw.io) or its maintainers. All illustration data and content are served from and owned by SciDraw.io.

> An MCP (Model Context Protocol) server for searching and downloading scientific illustrations from [SciDraw.io](https://scidraw.io).

[中文文档](./README_zh.md) | **English**

---

## Overview

**SciDraw.io** is a free, open repository of high-quality scientific illustrations for publications, posters, and presentations. All illustrations are licensed under Creative Commons (CC-BY 4.0 or CC0) and are free to use and remix.

**SciDraw MCP** is a Model Context Protocol (MCP) server that exposes SciDraw's public REST API as a set of tools that AI assistants (such as Claude, Cursor, and other MCP-compatible clients) can call directly. This allows you to search for scientific illustrations, view their metadata, and download image files — all through natural-language conversation with your AI assistant.

### Key Features

- **🔍 Search Illustrations** — Search by keyword, category, author, file type, and sort order.
- **📋 View Details** — Get full metadata for any drawing, including all authors, DOI, file size, and license.
- **⬇️ Download Files** — Download the actual SVG/PNG image file, returned as a viewable image.
- **🏷️ Browse Categories** — List all illustration categories with drawing counts.

### Available Tools

| Tool | Description |
|------|-------------|
| `search_drawings` | Search for scientific illustrations by keyword, category, author, file type, and sort order. Returns paginated results. |
| `get_drawing` | Get detailed metadata for a specific drawing by its slug (including all authors, DOI, file size, license). |
| `download_drawing` | Download a drawing's image file (SVG or PNG). Returns the file as a displayable image resource. |
| `list_categories` | List all available illustration categories on SciDraw with drawing counts. |

---

## Quick Start

### Prerequisites

- **Node.js ≥ 18.0.0** (for built-in `fetch` support)
- An MCP-compatible client (e.g., [Claude Desktop](https://claude.ai/download), [Cursor](https://cursor.sh), or any other MCP client)

### Installation

#### Option A: Use directly with npx (recommended)

No installation needed — `npx` will fetch and run the server automatically:

```bash
npx scidraw-mcp
```

#### Option B: Install globally

```bash
npm install -g scidraw-mcp
scidraw-mcp
```

#### Option C: Build from source

```bash
git clone https://github.com/scidraw-mcp/scidraw-mcp.git
cd scidraw-mcp
npm install
npm run build
node dist/index.js
```

---

## Configuration

### Claude Desktop

Add the following to your Claude Desktop configuration file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

If you installed globally:

```json
{
  "mcpServers": {
    "scidraw": {
      "command": "scidraw-mcp"
    }
  }
}
```

If you built from source:

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

### Cursor

Add to Cursor's MCP settings (`Settings → MCP`):

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

### Other MCP Clients

This server uses the **stdio transport**, which is the standard MCP transport. Any MCP-compatible client that supports stdio transport can connect to it. Start the server with:

```bash
npx scidraw-mcp
```

---

## Usage Examples

Once connected to your AI assistant, you can use natural language to interact with SciDraw:

### Example 1: Search for illustrations

> "Search SciDraw for brain illustrations"

The assistant will call the `search_drawings` tool with `search: "brain"` and return a list of matching illustrations with their metadata.

### Example 2: Browse by category

> "Show me all mouse illustrations on SciDraw"

The assistant will call `search_drawings` with `category: "mouse"`.

### Example 3: Get details of a specific drawing

> "Get details for the drawing with slug 'mouse-ded16e1d'"

The assistant will call `get_drawing` and return full metadata including authors, DOI, file size, and license.

### Example 4: Download an illustration

> "Download the mouse illustration"

The assistant will call `download_drawing` and return the SVG file as a displayable image.

### Example 5: List categories

> "What categories are available on SciDraw?"

The assistant will call `list_categories` and return all categories with their drawing counts.

---

## API Reference

### SciDraw API

This server wraps the public SciDraw REST API at `https://scidraw.io/api/v1/`. The following endpoints are used:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/drawings/` | GET | Search/list drawings with filters (search, category, is_vector, ordering, author, image_type, cursor) |
| `/api/v1/drawings/{slug}/` | GET | Get detailed information for a specific drawing |
| `/api/v1/drawings/{slug}/download/` | GET | Download the drawing's image file |
| `/api/v1/categories/` | GET | List all illustration categories |

### Categories

SciDraw organizes illustrations into the following categories:

| Category | Slug | Description |
|----------|------|-------------|
| Mouse | `mouse` | Mouse illustrations |
| Rat | `rat` | Rat illustrations |
| Fish | `fish` | Fish (including zebrafish) |
| Drosophila | `drosophila` | Fruit fly |
| Human | `human` | Human anatomy |
| Bird | `bird` | Bird illustrations |
| Cell | `cell` | Cellular biology |
| Other | `other` | Other scientific illustrations |

### Sort Orders

When searching, the following sort orders are available:

| Order | Description |
|-------|-------------|
| `downloads` | Most downloaded first (default) |
| `newest` | Newest illustrations first |
| `name` | Alphabetical order (A-Z) |

---

## Project Structure

```
scidraw-mcp/
├── src/
│   ├── index.ts        # Server entry point — creates and starts the MCP server
│   ├── client.ts       # SciDraw API client (fetch wrapper)
│   ├── tools.ts        # MCP tool definitions and handlers
│   └── types.ts        # TypeScript type definitions for API responses
├── package.json
├── tsconfig.json
├── LICENSE
├── README.md           # English documentation (this file)
└── README_zh.md        # Chinese documentation
```

---

## Development

### Build

```bash
npm run build
```

### Run in development mode

```bash
npm run dev    # Watch mode — rebuilds on file changes
```

### Manual testing

Start the server and send MCP messages via stdin (for debugging):

```bash
npm run build && node dist/index.js
```

---

## Licensing

### This MCP Server

This MCP server project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

> **Note:** This is an unofficial, community-maintained project. It is not affiliated with or endorsed by SciDraw.io.

### SciDraw Illustrations

All illustrations accessible through this tool are hosted by [SciDraw.io](https://scidraw.io) and are licensed under:

- **Creative Commons Attribution 4.0** (CC-BY 4.0) — most illustrations
- **Creative Commons Zero** (CC0) — some illustrations

When using downloaded illustrations, please:

1. **Cite the authors** — Use the DOI provided with each drawing.
2. **Acknowledge SciDraw.io** — Include the SciDraw logo in your work.
3. **Respect the license** — CC-BY requires attribution; CC0 does not.

For more information, see [SciDraw's licensing page](https://scidraw.io/about).

---

## Acknowledgements

- **[SciDraw.io](https://scidraw.io)** — The open repository of scientific illustrations that makes this MCP server possible. Created and maintained by [Alex Harston](https://buymeacoffee.com/alexharston).
- **[Model Context Protocol](https://modelcontextprotocol.io)** — The protocol specification that enables AI assistants to interact with external tools.
- All the **scientists and illustrators** who have contributed their drawings to SciDraw for the community to use.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Troubleshooting

### Server fails to start

- Ensure Node.js ≥ 18 is installed: `node --version`
- If using `npx`, try clearing the npx cache: `npx clear-npx-cache`
- If building from source, ensure dependencies are installed: `npm install`

### Connection issues in Claude Desktop

- Restart Claude Desktop after editing the configuration file
- Check the logs: `~/Library/Logs/Claude/mcp-server-scidraw.log` (macOS)
- Verify the server path is correct (use absolute paths)

### API errors

- The SciDraw API is a public service and may occasionally be unavailable
- Check your internet connection
- If you receive HTTP 429 (Too Many Requests), wait a moment and try again
