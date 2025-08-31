import { z } from 'zod';

// User types
export interface User {
  id: string;
  email: string;
  created_at: Date;
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.date()
});

// Item types (Instagram posts)
export type MediaType = 'image' | 'video' | 'reel' | 'album';
export type ItemStatus = 'active' | 'unavailable' | 'error';
export type Source = 'export' | 'telegram' | 'discord' | 'whatsapp' | 'igdm';

export interface Item {
  id: string;
  user_id: string;
  permalink: string;
  post_id?: string;
  creator_handle?: string;
  media_type?: MediaType;
  saved_at?: Date;
  ingested_at: Date;
  lang?: string;
  source: Source;
  status: ItemStatus;
}

export const ItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  permalink: z.string().url(),
  post_id: z.string().optional(),
  creator_handle: z.string().optional(),
  media_type: z.enum(['image', 'video', 'reel', 'album']).optional(),
  saved_at: z.date().optional(),
  ingested_at: z.date(),
  lang: z.string().optional(),
  source: z.enum(['export', 'telegram', 'discord', 'whatsapp', 'igdm']),
  status: z.enum(['active', 'unavailable', 'error'])
});

// Content types
export interface ItemContent {
  item_id: string;
  caption?: string;
  hashtags: string[];
  mentions: string[];
  embed_html?: string;
  thumb_url?: string;
  width?: number;
  height?: number;
}

export const ItemContentSchema = z.object({
  item_id: z.string().uuid(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()),
  mentions: z.array(z.string()),
  embed_html: z.string().optional(),
  thumb_url: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});

// Enrichment types
export type Topic = 
  | 'recipes' | 'fitness' | 'coding' | 'career' | 'design' 
  | 'travel' | 'finance' | 'politics' | 'philosophy' | 'photography'
  | 'DIY' | 'health' | 'news' | 'memes' | 'inspiration'
  | 'fashion' | 'beauty' | 'home' | 'education' | 'gaming';

export type Quality = 'how-to' | 'tutorial' | 'review' | 'opinion' | 'list' | 'news' | 'reference' | 'meme';

export interface ItemEnrichment {
  item_id: string;
  topics: Topic[];
  keywords: string[];
  entities: {
    people: string[];
    brands: string[];
    places: string[];
  };
  qualities: Quality[];
  confidence?: number;
}

export const ItemEnrichmentSchema = z.object({
  item_id: z.string().uuid(),
  topics: z.array(z.enum([
    'recipes', 'fitness', 'coding', 'career', 'design', 
    'travel', 'finance', 'politics', 'philosophy', 'photography',
    'DIY', 'health', 'news', 'memes', 'inspiration',
    'fashion', 'beauty', 'home', 'education', 'gaming'
  ])),
  keywords: z.array(z.string()),
  entities: z.object({
    people: z.array(z.string()),
    brands: z.array(z.string()),
    places: z.array(z.string())
  }),
  qualities: z.array(z.enum(['how-to', 'tutorial', 'review', 'opinion', 'list', 'news', 'reference', 'meme'])),
  confidence: z.number().min(0).max(1).optional()
});

// Vector embeddings
export interface ItemEmbedding {
  item_id: string;
  embedding: number[];
}

export const ItemEmbeddingSchema = z.object({
  item_id: z.string().uuid(),
  embedding: z.array(z.number())
});

// Collections and organization
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
}

export const CollectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  created_at: z.date()
});

export interface CollectionItem {
  collection_id: string;
  item_id: string;
}

export const CollectionItemSchema = z.object({
  collection_id: z.string().uuid(),
  item_id: z.string().uuid()
});

// Notes
export interface Note {
  id: string;
  item_id: string;
  user_id: string;
  body: string;
  created_at: Date;
  updated_at: Date;
}

export const NoteSchema = z.object({
  id: z.string().uuid(),
  item_id: z.string().uuid(),
  user_id: z.string().uuid(),
  body: z.string(),
  created_at: z.date(),
  updated_at: z.date()
});

// Jobs and audit
export type JobType = 'hydrate' | 'tag' | 'embed' | 'import';
export type JobStatus = 'queued' | 'running' | 'done' | 'error';

export interface Job {
  id: string;
  user_id?: string;
  type: JobType;
  payload: Record<string, any>;
  status: JobStatus;
  created_at: Date;
  updated_at: Date;
}

export const JobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  type: z.enum(['hydrate', 'tag', 'embed', 'import']),
  payload: z.record(z.any()),
  status: z.enum(['queued', 'running', 'done', 'error']),
  created_at: z.date(),
  updated_at: z.date()
}).required();

export interface AuditLog {
  id: number;
  user_id?: string;
  action: string;
  item_id?: string;
  meta: Record<string, any>;
  at: Date;
}

export const AuditLogSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid().optional(),
  action: z.string(),
  item_id: z.string().uuid().optional(),
  meta: z.record(z.any()),
  at: z.date()
});

// Search and API types
export interface SearchQuery {
  q: string;
  filters?: {
    topics?: Topic[];
    creator?: string;
    media_type?: MediaType;
    lang?: string;
    date_from?: string;
    date_to?: string;
  };
  page?: number;
  limit?: number;
}

export const SearchQuerySchema = z.object({
  q: z.string(),
  filters: z.object({
    topics: z.array(z.enum([
      'recipes', 'fitness', 'coding', 'career', 'design', 
      'travel', 'finance', 'politics', 'philosophy', 'photography',
      'DIY', 'health', 'news', 'memes', 'inspiration',
      'fashion', 'beauty', 'home', 'education', 'gaming'
    ])).optional(),
    creator: z.string().optional(),
    media_type: z.enum(['image', 'video', 'reel', 'album']).optional(),
    lang: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional()
  }).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

export interface SearchResult {
  item_id: string;
  score: number;
  permalink: string;
  creator?: string;
  media_type?: MediaType;
  snippet: string;
  topics: Topic[];
  keywords: string[];
  thumb_url?: string;
}

export const SearchResultSchema = z.object({
  item_id: z.string().uuid(),
  score: z.number(),
  permalink: z.string().url(),
  creator: z.string().optional(),
  media_type: z.enum(['image', 'video', 'reel', 'album']).optional(),
  snippet: z.string(),
  topics: z.array(z.enum([
    'recipes', 'fitness', 'coding', 'career', 'design', 
    'travel', 'finance', 'politics', 'philosophy', 'photography',
    'DIY', 'health', 'news', 'memes', 'inspiration',
    'fashion', 'beauty', 'home', 'education', 'gaming'
  ])),
  keywords: z.array(z.string()),
  thumb_url: z.string().url().optional()
});

// Export all schemas
export const Schemas = {
  User: UserSchema,
  Item: ItemSchema,
  ItemContent: ItemContentSchema,
  ItemEnrichment: ItemEnrichmentSchema,
  ItemEmbedding: ItemEmbeddingSchema,
  Collection: CollectionSchema,
  CollectionItem: CollectionItemSchema,
  Note: NoteSchema,
  Job: JobSchema,
  AuditLog: AuditLogSchema,
  SearchQuery: SearchQuerySchema,
  SearchResult: SearchResultSchema
};
