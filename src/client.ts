/**
 * SciDraw API client.
 *
 * Wraps the public SciDraw REST API (`https://scidraw.io/api/v1/`) with a small,
 * typed interface suitable for use inside MCP tool handlers.
 */

import type {
  CategoryItem,
  DrawingDetail,
  DrawingListItem,
  PaginatedResponse,
  SearchDrawingsParams,
} from "./types.js";

/** Base URL for the SciDraw public API. */
export const SCIDRAW_API_BASE = "https://scidraw.io/api/v1";

/** Base URL for the SciDraw website (used for building links). */
export const SCIDRAW_WEB_BASE = "https://scidraw.io";

/** Default HTTP timeout (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Version of this MCP server, used in the User-Agent header. */
const SERVER_VERSION = "0.1.0";

/** User-Agent string sent with every request to the SciDraw API. */
const USER_AGENT = `scidraw-mcp/${SERVER_VERSION}`;

/** Content-Types considered to be valid image responses. */
const IMAGE_CONTENT_TYPES = [
  "image/svg+xml",
  "image/svg",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

/**
 * Map a MIME content-type to a file extension.
 */
function contentTypeToExt(contentType: string): string {
  const ct = contentType.split(";")[0].trim().toLowerCase();
  if (ct === "image/svg+xml" || ct === "image/svg") return "svg";
  if (ct === "image/png") return "png";
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/gif") return "gif";
  if (ct === "image/webp") return "webp";
  return "bin";
}

/**
 * A lightweight HTTP client for the SciDraw API.
 *
 * Uses the global `fetch` available in Node.js ≥ 18.
 */
export class SciDrawClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string = SCIDRAW_API_BASE, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
  }

  /**
   * Perform a GET request and return parsed JSON.
   *
   * @throws {Error} If the request fails or the response is not OK.
   */
  private async getJson<T>(path: string): Promise<T> {
    const url = path.startsWith("http")
      ? path
      : `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `SciDraw API returned HTTP ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`,
        );
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Fetch a binary blob (e.g. SVG / PNG file) as a `Buffer`.
   *
   * @throws {Error} If the request fails.
   */
  async fetchBlob(url: string): Promise<{ data: Buffer; contentType: string; contentLength: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Failed to download file: HTTP ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`,
        );
      }

      const contentType = res.headers.get("content-type") ?? "application/octet-stream";

      // Guard against non-image responses (e.g. an HTML error page).
      const isImage = IMAGE_CONTENT_TYPES.some((t) =>
        contentType.toLowerCase().startsWith(t),
      );
      if (!isImage) {
        const snippet = await res.text().catch(() => "");
        throw new Error(
          `Expected an image file but received "${contentType}". The server may have returned an error page. snippet=${snippet.slice(0, 150)}`,
        );
      }

      const arrayBuffer = await res.arrayBuffer();
      return {
        data: Buffer.from(arrayBuffer),
        contentType,
        contentLength: Number(res.headers.get("content-length") ?? arrayBuffer.byteLength),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Search / list drawings with optional filters.
   *
   * Wraps `GET /api/v1/drawings/`.
   */
  async searchDrawings(params: SearchDrawingsParams = {}): Promise<PaginatedResponse<DrawingListItem>> {
    const query = new URLSearchParams();

    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.is_vector !== undefined) query.set("is_vector", String(params.is_vector));
    if (params.ordering) query.set("ordering", params.ordering);
    if (params.author) query.set("author", params.author);
    if (params.image_type) query.set("image_type", params.image_type);
    if (params.cursor) query.set("cursor", params.cursor);

    // The API paginates; we default to a page size that is useful for an LLM
    // context window without being overwhelming.
    const limit = params.limit ?? 20;
    query.set("limit", String(limit));

    const qs = query.toString();
    return this.getJson<PaginatedResponse<DrawingListItem>>(`/drawings/${qs ? `?${qs}` : ""}`);
  }

  /**
   * Get detailed information about a single drawing by its slug.
   *
   * Wraps `GET /api/v1/drawings/{slug}/`.
   */
  async getDrawing(slug: string): Promise<DrawingDetail> {
    return this.getJson<DrawingDetail>(`/drawings/${encodeURIComponent(slug)}/`);
  }

  /**
   * Get the download URL for a drawing (does not fetch the file).
   */
  getDownloadUrl(slug: string): string {
    return `${this.baseUrl}/drawings/${encodeURIComponent(slug)}/download/`;
  }

  /**
   * Download a drawing's image file and return it as a buffer.
   *
   * The filename is derived from the slug and the content-type returned by
   * the server, so no extra detail request is needed.
   */
  async downloadDrawing(slug: string): Promise<{
    data: Buffer;
    contentType: string;
    contentLength: number;
    filename: string;
  }> {
    const url = this.getDownloadUrl(slug);
    const blob = await this.fetchBlob(url);

    // Derive a filename from the slug and the content type of the response.
    const ext = contentTypeToExt(blob.contentType);
    const filename = `${slug}.${ext}`;

    return { ...blob, filename };
  }

  /**
   * List all available categories.
   *
   * Wraps `GET /api/v1/categories/`.
   */
  async listCategories(): Promise<CategoryItem[]> {
    return this.getJson<CategoryItem[]>(`/categories/`);
  }

  /**
   * Build the public web URL for a drawing (useful for display in results).
   */
  getDrawingWebUrl(slug: string): string {
    return `${SCIDRAW_WEB_BASE}/drawing/${slug}`;
  }

  /**
   * Build the public web URL for a category.
   */
  getCategoryWebUrl(slug: string): string {
    return `${SCIDRAW_WEB_BASE}/category/${slug}`;
  }

  /**
   * Build the DOI URL for a drawing.
   */
  getDoiUrl(doi: string): string {
    return `https://doi.org/${doi}`;
  }
}

/** A shared default client instance. */
export const defaultClient = new SciDrawClient();
