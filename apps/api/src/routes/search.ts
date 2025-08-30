import { FastifyInstance } from 'fastify';

export async function registerSearchRoutes(server: FastifyInstance): Promise<void> {
  // TODO: Implement search routes
  // - GET /search - Hybrid search (BM25 + vector)
  // - GET /search/suggestions - Search suggestions
  
  server.get('/', async () => {
    return { message: 'Search routes - coming soon' };
  });
}
