import { FastifyInstance } from 'fastify';
import { registerImportRoutes } from './import';
import { registerIngestRoutes } from './ingest';
import { registerBotRoutes } from './bots';
import { registerItemRoutes } from './items';
import { registerSearchRoutes } from './search';
import { registerCollectionRoutes } from './collections';
import { registerNoteRoutes } from './notes';
import { getInstagramService } from '../services/instagram-factory';
import { config } from '../config';

export async function registerRoutes(server: FastifyInstance): Promise<void> {
  // Register all route modules
  await server.register(registerImportRoutes, { prefix: '/import' });
  await server.register(registerIngestRoutes, { prefix: '/ingest' });
  await server.register(registerBotRoutes, { prefix: '/webhook' });
  await server.register(registerItemRoutes, { prefix: '/items' });
  await server.register(registerSearchRoutes, { prefix: '/search' });
  await server.register(registerCollectionRoutes, { prefix: '/collections' });
  await server.register(registerNoteRoutes, { prefix: '/notes' });

  // API info endpoint
  server.get('/api', async () => {
    return {
      name: 'Instagram Saves Knowledge Dashboard API',
      version: '1.0.0',
      description: 'API for managing Instagram saved posts with LLM enrichment',
      endpoints: {
        import: '/import',
        ingest: '/ingest',
        webhooks: '/webhook',
        items: '/items',
        search: '/search',
        collections: '/collections',
        notes: '/notes'
      },
      documentation: '/docs'
    };
  });

  // Service status endpoint
  server.get('/status', async () => {
    const instagramService = getInstagramService(config.instagramAccessToken);
    const serviceType = instagramService.constructor.name;
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        instagram: {
          type: serviceType,
          mode: serviceType === 'MockInstagramService' ? 'mock' : 'real',
          hasAccessToken: !!config.instagramAccessToken,
          status: 'operational'
        },
        database: 'not_configured', // TODO: Add database health check
        redis: 'not_configured',    // TODO: Add Redis health check
        search: 'not_configured'    // TODO: Add search health check
      },
      environment: config.nodeEnv,
      version: '1.0.0'
    };
  });
}
