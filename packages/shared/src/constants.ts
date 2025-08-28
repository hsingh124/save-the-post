// Instagram Saves Knowledge Dashboard Constants

// Controlled vocabulary for topics (from PRD)
export const TOPICS = [
  'recipes',
  'fitness', 
  'coding',
  'career',
  'design',
  'travel',
  'finance',
  'politics',
  'philosophy',
  'photography',
  'DIY',
  'health',
  'news',
  'memes',
  'inspiration',
  'fashion',
  'beauty',
  'home',
  'education',
  'gaming'
] as const;

// Content qualities
export const QUALITIES = [
  'how-to',
  'tutorial',
  'review',
  'opinion',
  'list',
  'news',
  'reference',
  'meme'
] as const;

// Media types
export const MEDIA_TYPES = [
  'image',
  'video',
  'reel',
  'album'
] as const;

// Data sources
export const SOURCES = [
  'export',
  'telegram',
  'discord',
  'whatsapp',
  'igdm'
] as const;

// Item statuses
export const ITEM_STATUSES = [
  'active',
  'unavailable',
  'error'
] as const;

// Job types
export const JOB_TYPES = [
  'hydrate',
  'tag',
  'embed',
  'import'
] as const;

// Job statuses
export const JOB_STATUSES = [
  'queued',
  'running',
  'done',
  'error'
] as const;

// Performance targets (from PRD)
export const PERFORMANCE_TARGETS = {
  SEARCH_P95_MS: 300,
  DASHBOARD_LOAD_P95_MS: 1500,
  BOT_CAPTURE_VISIBILITY_MS: 5000,
  LLM_ENRICHMENT_MS: 60000,
  IMPORT_10K_ITEMS_MINUTES: 15
} as const;

// Rate limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  IMPORT_REQUESTS_PER_HOUR: 10,
  BOT_REQUESTS_PER_MINUTE: 60,
  SEARCH_REQUESTS_PER_MINUTE: 200
} as const;

// LLM configuration
export const LLM_CONFIG = {
  MAX_CAPTION_LENGTH: 2000,
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  CONFIDENCE_THRESHOLD: 0.7,
  COST_TARGET_PER_100_POSTS: 0.15
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  MAX_RESULTS_PER_PAGE: 100,
  DEFAULT_PAGE_SIZE: 20,
  HYBRID_WEIGHTS: {
    BM25: 0.55,
    VECTOR: 0.35,
    TOPIC_MATCH: 0.05,
    RECENCY: 0.05
  },
  VECTOR_DIMENSIONS: 768,
  MIN_SCORE_THRESHOLD: 0.1
} as const;

// Instagram oEmbed configuration
export const INSTAGRAM_CONFIG = {
  OEMBED_ENDPOINT: 'https://api.instagram.com/oembed',
  CACHE_TTL_HOURS: 24,
  MAX_RETRIES: 3,
  RATE_LIMIT_PER_HOUR: 1000
} as const;

// Bot webhook patterns
export const BOT_PATTERNS = {
  TELEGRAM: /^\/webhook\/telegram$/,
  DISCORD: /^\/webhook\/discord$/,
  WHATSAPP: /^\/webhook\/whatsapp$/,
  IGDM: /^\/webhook\/igdm$/
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 100,
  ALLOWED_FORMATS: ['.zip', '.json'],
  MAX_IMPORT_ITEMS: 10000
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  THUMBNAIL_TTL_HOURS: 168, // 1 week
  EMBED_TTL_HOURS: 24,
  SEARCH_TTL_MINUTES: 5,
  USER_SESSION_TTL_HOURS: 24
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  SESSION_SECRET_LENGTH: 32,
  API_KEY_LENGTH: 64,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15
} as const;

// Environment variables
export const ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  DATABASE_URL: 'DATABASE_URL',
  REDIS_URL: 'REDIS_URL',
  S3_BUCKET: 'S3_BUCKET',
  S3_REGION: 'S3_REGION',
  S3_ACCESS_KEY: 'S3_ACCESS_KEY',
  S3_SECRET_KEY: 'S3_SECRET_KEY',
  INSTAGRAM_ACCESS_TOKEN: 'INSTAGRAM_ACCESS_TOKEN',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  TELEGRAM_BOT_TOKEN: 'TELEGRAM_BOT_TOKEN',
  DISCORD_BOT_TOKEN: 'DISCORD_BOT_TOKEN',
  JWT_SECRET: 'JWT_SECRET',
  MEILISEARCH_URL: 'MEILISEARCH_URL',
  MEILISEARCH_KEY: 'MEILISEARCH_KEY'
} as const;

// Default values
export const DEFAULTS = {
  USER_AVATAR: '/images/default-avatar.png',
  ITEM_THUMBNAIL: '/images/default-thumbnail.png',
  COLLECTION_COLOR: '#3B82F6',
  MAX_COLLECTIONS_PER_USER: 50,
  MAX_NOTES_PER_ITEM: 10,
  MAX_TAGS_PER_ITEM: 20
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_INSTAGRAM_URL: 'Invalid Instagram URL format',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  ITEM_NOT_FOUND: 'Item not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  INSTAGRAM_UNAVAILABLE: 'Instagram post is unavailable',
  IMPORT_FAILED: 'Import failed. Please check your file format.',
  LLM_PROCESSING_ERROR: 'Content processing failed. Please try again.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ITEM_SAVED: 'Item saved successfully',
  COLLECTION_CREATED: 'Collection created successfully',
  NOTE_ADDED: 'Note added successfully',
  IMPORT_STARTED: 'Import started successfully',
  ITEM_DELETED: 'Item deleted successfully',
  ACCOUNT_DELETED: 'Account deleted successfully'
} as const;
