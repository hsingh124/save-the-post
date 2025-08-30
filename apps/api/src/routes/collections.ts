import { FastifyInstance } from 'fastify';

export async function registerCollectionRoutes(server: FastifyInstance): Promise<void> {
  // TODO: Implement collection routes
  // - POST /collections - Create collection
  // - GET /collections - List collections
  // - POST /collections/:id/items - Add item to collection
  
  server.get('/', async () => {
    return { message: 'Collection routes - coming soon' };
  });
}
