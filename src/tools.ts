/**
 * MCP tool definitions and handlers for the SciDraw API.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SciDrawClient, SCIDRAW_WEB_BASE } from "./client.js";

/**
 * Register all SciDraw MCP tools on the given server instance.
 *
 * Tools provided:
 *  1. `search_drawings` — Search / browse scientific illustrations by keyword, category, etc.
 *  2. `get_drawing`      — Get detailed metadata for a specific drawing.
 *  3. `download_drawing` — Download a drawing's image file (returns base64-encoded content).
 *  4. `list_categories`  — List all illustration categories on SciDraw.
 */
export function registerTools(server: McpServer, client: SciDrawClient): void {
  // ─── Tool 1: search_drawings ────────────────────────────────────────────
  server.tool(
    "search_drawings",
    `Search for scientific illustrations on SciDraw.io by keyword, category, and other filters.

Returns a paginated list of drawings with metadata (name, author, download count, DOI, image URL, etc.).

Parameters:
- search   (optional): Free-text search query, e.g. "brain", "syringe", "petri dish".
- category (optional): Category slug — one of: mouse, rat, fish, drosophila, other, human, bird, cell.
- is_vector(optional): If true, only return vector (SVG) images; if false, return raster (PNG etc.).
- ordering (optional): Sort order — "downloads" (most downloaded), "newest" (newest first), "name" (A-Z).
- author   (optional): Filter by author name (partial match).
- image_type(optional): Filter by file type, e.g. "svg" or "png".
- cursor   (optional): Pagination cursor for fetching the next page of results.
- limit    (optional): Number of results per page (default 20, max 50).`,
    {
      search: z.string().optional().describe('Free-text search query, e.g. "brain", "syringe"'),
      category: z
        .enum(["mouse", "rat", "fish", "drosophila", "other", "human", "bird", "cell"])
        .optional()
        .describe("Category slug to filter by"),
      is_vector: z
        .boolean()
        .optional()
        .describe("If true, only return vector (SVG) images; if false, return raster images"),
      ordering: z
        .enum(["downloads", "newest", "name"])
        .optional()
        .describe("Sort order: 'downloads' (most downloaded), 'newest', or 'name' (A-Z)"),
      author: z.string().optional().describe("Filter by author name (partial match)"),
      image_type: z.string().optional().describe('Filter by file type, e.g. "svg" or "png"'),
      cursor: z.string().optional().describe("Pagination cursor for the next page of results"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of results per page (default 20, max 50)"),
    },
    async (args) => {
      try {
        const result = await client.searchDrawings({
          search: args.search,
          category: args.category,
          is_vector: args.is_vector,
          ordering: args.ordering,
          author: args.author,
          image_type: args.image_type,
          cursor: args.cursor,
          limit: args.limit,
        });

        const lines: string[] = [];
        lines.push(`Found drawings (showing ${result.results.length} results):`);
        lines.push("");

        for (const d of result.results) {
          lines.push(`• ${d.name}`);
          lines.push(`  ID/Slug: ${d.slug}`);
          lines.push(`  Author: ${d.primary_author.full_name}`);
          lines.push(`  Category: ${d.category_name}`);
          lines.push(`  Type: ${d.image_type}${d.is_vector ? " (vector)" : ""}`);
          lines.push(`  Downloads: ${d.times_downloaded.toLocaleString()}`);
          lines.push(`  DOI: ${d.doi}`);
          lines.push(`  Image URL: ${d.image_url}`);
          lines.push(`  Web URL: ${client.getDrawingWebUrl(d.slug)}`);
          lines.push(`  Created: ${d.created_at.split("T")[0]}`);
          lines.push("");
        }

        if (result.next) {
          // Extract cursor from the next URL for convenience.
          try {
            const nextUrl = new URL(result.next);
            const nextCursor = nextUrl.searchParams.get("cursor") ?? "";
            if (nextCursor) {
              lines.push(`--- Next page available ---`);
              lines.push(`Use cursor="${nextCursor}" to fetch the next page.`);
            } else {
              lines.push(`--- Next page available ---`);
              lines.push(`Fetch the next page at: ${result.next}`);
            }
          } catch {
            lines.push(`--- Next page available ---`);
            lines.push(`Fetch the next page at: ${result.next}`);
          }
        }

        if (!result.results.length) {
          lines.push("No drawings found. Try different search terms or filters.");
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error searching drawings: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 2: get_drawing ────────────────────────────────────────────────
  server.tool(
    "get_drawing",
    `Get detailed metadata for a specific SciDraw illustration by its slug.

Returns full information including: all authors (with website/ORCID/Twitter), file size,
category details, DOI, Zenodo ID, view count, and download count.

Parameters:
- slug (required): The drawing's slug identifier, e.g. "mouse-ded16e1d" (from search results).`,
    {
      slug: z.string().describe('Drawing slug, e.g. "mouse-ded16e1d" (from search results)'),
    },
    async (args) => {
      try {
        const d = await client.getDrawing(args.slug);

        const lines: string[] = [];
        lines.push(`=== ${d.name} ===`);
        lines.push("");
        lines.push(`Slug: ${d.slug}`);
        lines.push(`ID: ${d.id}`);
        lines.push("");
        lines.push("Authors:");
        for (const a of d.authors) {
          const parts = [a.full_name];
          if (a.website) parts.push(`website: ${a.website}`);
          if (a.orcid) parts.push(`ORCID: ${a.orcid}`);
          if (a.twitter_handle) parts.push(`Twitter: @${a.twitter_handle}`);
          if (a.bluesky_handle) parts.push(`Bluesky: @${a.bluesky_handle}`);
          lines.push(`  • ${parts.join(" | ")}`);
        }
        lines.push("");
        lines.push(`Category: ${d.category.name} (${d.category.slug}) — ${d.category.drawing_count} drawings in this category`);
        lines.push(`Image Type: ${d.image_type}${d.is_vector ? " (vector)" : " (raster)"}${d.is_layered ? " [layered]" : ""}`);
        lines.push(`File Size: ${(d.file_size / 1024).toFixed(1)} KB`);
        lines.push(`License: ${d.license}`);
        if (d.doi) {
          lines.push(`DOI: ${d.doi}`);
          lines.push(`DOI URL: ${client.getDoiUrl(d.doi)}`);
        } else {
          lines.push(`DOI: (none)`);
        }
        lines.push(`Zenodo ID: ${d.zenodo_id || "(none)"}`);
        lines.push(`Downloads: ${d.times_downloaded.toLocaleString()}`);
        lines.push(`Views: ${d.view_count.toLocaleString()}`);
        lines.push(`Created: ${d.created_at.split("T")[0]}`);
        lines.push("");
        lines.push(`Image URL: ${d.image_url}`);
        lines.push(`Web URL: ${client.getDrawingWebUrl(d.slug)}`);
        lines.push(`Download URL: ${client.getDownloadUrl(d.slug)}`);

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error getting drawing details: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 3: download_drawing ──────────────────────────────────────────
  server.tool(
    "download_drawing",
    `Download a scientific illustration's image file from SciDraw.

Returns the file content as a base64-encoded blob along with metadata (filename,
MIME type, file size). The file can be an SVG (vector) or PNG (raster) image.

Use this after searching for drawings to obtain the actual image file.

Parameters:
- slug (required): The drawing's slug identifier (from search results).`,
    {
      slug: z.string().describe('Drawing slug, e.g. "mouse-ded16e1d" (from search results)'),
    },
    async (args) => {
      try {
        const result = await client.downloadDrawing(args.slug);

        const meta = [
          `File: ${result.filename}`,
          `Type: ${result.contentType}`,
          `Size: ${(result.contentLength / 1024).toFixed(1)} KB`,
          `Base64 length: ${result.data.toString("base64").length} chars`,
        ].join("\n");

        return {
          content: [
            { type: "text", text: `Successfully downloaded "${result.filename}".` },
            { type: "text", text: meta },
            {
              type: "image",
              data: result.data.toString("base64"),
              mimeType: result.contentType,
            },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error downloading drawing: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 4: list_categories ────────────────────────────────────────────
  server.tool(
    "list_categories",
    `List all available illustration categories on SciDraw.io.

Returns each category's name, slug, and the number of drawings it contains.
Use the slug as the "category" parameter when calling search_drawings.`,
    {},
    async () => {
      try {
        const categories = await client.listCategories();

        const lines: string[] = [];
        lines.push("SciDraw Illustration Categories:");
        lines.push("");
        lines.push(
          "Category".padEnd(15) +
            "Slug".padEnd(15) +
            "Drawings".padStart(10),
        );
        lines.push("-".repeat(40));

        for (const c of categories) {
          lines.push(
            c.name.padEnd(15) +
              c.slug.padEnd(15) +
              String(c.drawing_count).padStart(10),
          );
        }

        const total = categories.reduce((sum, c) => sum + c.drawing_count, 0);
        lines.push("-".repeat(40));
        lines.push(`Total: ${total} illustrations across ${categories.length} categories`);
        lines.push("");
        lines.push(`Browse all at: ${SCIDRAW_WEB_BASE}/search`);

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error listing categories: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}
