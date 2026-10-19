/**
 * Type definitions for SciDraw API responses.
 */

/** Author information in a drawing list item. */
export interface PrimaryAuthor {
  id: string;
  full_name: string;
}

/** A drawing item as returned by the list endpoint (`/api/v1/drawings/`). */
export interface DrawingListItem {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  image_type: string;
  is_vector: boolean;
  license: string;
  category_slug: string;
  category_name: string;
  times_downloaded: number;
  doi: string;
  primary_author: PrimaryAuthor;
  created_at: string;
}

/** Paginated response wrapper used by the list endpoint. */
export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Full author information as returned by the detail endpoint. */
export interface Author {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  twitter_handle: string;
  bluesky_handle: string;
  website: string;
  orcid: string;
  /** Any extra fields the API may return in future. */
  [key: string]: unknown;
}

/** Category information in a drawing detail response. */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  drawing_count: number;
}

/** A drawing detail as returned by `/api/v1/drawings/{slug}/`. */
export interface DrawingDetail {
  id: string;
  name: string;
  slug: string;
  image: string;
  image_url: string;
  image_type: string;
  file_size: number;
  is_vector: boolean;
  is_layered: boolean;
  license: string;
  category: Category;
  authors: Author[];
  /** DOI string, may be empty if the drawing has no DOI. */
  doi: string;
  /** Zenodo ID, may be empty if the drawing is not on Zenodo. */
  zenodo_id: string;
  times_downloaded: number;
  view_count: number;
  created_at: string;
  /** Any extra fields the API may return in future. */
  [key: string]: unknown;
}

/** A category as returned by `/api/v1/categories/`. */
export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  drawing_count: number;
}

/** Parameters for searching drawings. */
export interface SearchDrawingsParams {
  search?: string;
  category?: string;
  is_vector?: boolean;
  ordering?: string;
  author?: string;
  image_type?: string;
  cursor?: string;
  limit?: number;
}
