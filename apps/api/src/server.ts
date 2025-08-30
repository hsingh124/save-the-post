import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { config } from './config';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

export async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: config.logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    },
    trustProxy: true
  });

  // Register plugins
  await server.register(cors, {
    origin: config.corsOrigins,
    credentials: true
  });

  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.instagram.com"]
      }
    }
  });

  await server.register(rateLimit, {
    max: config.rateLimitMaxRequests,
    timeWindow: config.rateLimitWindowMs,
    errorResponseBuilder: (req, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later.',
      retryAfter: Math.ceil(context.ttl / 1000)
    })
  });

  await server.register(multipart, {
    limits: {
      fileSize: config.maxFileSize * 1024 * 1024, // Convert MB to bytes
      files: 1
    }
  });

  // Swagger documentation
  if (config.enableSwagger) {
    await server.register(swagger, {
      swagger: {
        info: {
          title: 'Instagram Saves Knowledge Dashboard API',
          description: 'API for managing Instagram saved posts with LLM enrichment',
          version: '1.0.0'
        },
        host: config.host,
        schemes: ['http', 'https'],
        consumes: ['application/json', 'multipart/form-data'],
        produces: ['application/json'],
        tags: [
          { name: 'import', description: 'Import Instagram data exports' },
          { name: 'ingest', description: 'Ingest single Instagram URLs' },
          { name: 'items', description: 'Manage saved Instagram posts' },
          { name: 'search', description: 'Search saved posts' },
          { name: 'collections', description: 'Organize posts into collections' },
          { name: 'notes', description: 'Add notes to posts' },
          { name: 'bots', description: 'Bot webhook endpoints' }
        ]
      }
    });

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    });
  }

  // Register middleware
  server.addHook('onRequest', requestLogger);
  server.setErrorHandler(errorHandler);

  // Health check endpoint
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    };
  });

  // Register API routes
  await registerRoutes(server);

  return server;
}

export async function startServer(): Promise<void> {
  try {
    const server = await createServer();
    
    await server.listen({
      port: config.port,
      host: config.host
    });

    server.log.info(`Server listening on ${config.host}:${config.port}`);
    
    if (config.enableSwagger) {
      server.log.info(`API documentation available at http://${config.host}:${config.port}/docs`);
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
