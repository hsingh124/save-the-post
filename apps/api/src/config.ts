import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.API_PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'json',
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001'],
  
  // Rate limiting
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  
  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // Instagram API
  instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN || null,
  instagramAppId: process.env.INSTAGRAM_APP_ID || '',
  instagramAppSecret: process.env.INSTAGRAM_APP_SECRET || '',
  
  // Bot tokens
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
  discordApplicationId: process.env.DISCORD_APPLICATION_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'default-verify-token',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/save_the_post',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // S3/MinIO
  s3Bucket: process.env.S3_BUCKET || 'save-the-post',
  s3Region: process.env.S3_REGION || 'us-east-1',
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  
  // Search
  meilisearchUrl: process.env.MEILISEARCH_URL || 'http://localhost:7700',
  meilisearchKey: process.env.MEILISEARCH_KEY || 'masterKey',
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  
  // Feature flags
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  enableLLMEnrichment: process.env.ENABLE_LLM_ENRICHMENT !== 'false',
  enableVectorSearch: process.env.ENABLE_VECTOR_SEARCH !== 'false',
  enableBotIntegrations: process.env.ENABLE_BOT_INTEGRATIONS !== 'false',
  enableImportExport: process.env.ENABLE_IMPORT_EXPORT !== 'false',
  enableMockInstagram: process.env.ENABLE_MOCK_INSTAGRAM === 'true' || !process.env.INSTAGRAM_ACCESS_TOKEN,
  
  // Monitoring
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  
  // Security
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
  
  // Performance
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '100', 10)
} as const;

// Validate required configuration
export function validateConfig(): void {
  const required = [
    'telegramBotToken',
    'discordBotToken'
  ];

  // Instagram access token is optional - will use mock service if not provided
  if (!config.instagramAccessToken) {
    console.warn('⚠️ No Instagram access token provided - will use mock service');
  }

  const missing = required.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

// Export configuration type
export type Config = typeof config;
