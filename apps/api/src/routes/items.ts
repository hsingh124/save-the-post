import { FastifyInstance } from 'fastify';

export async function registerItemRoutes(server: FastifyInstance): Promise<void> {
  // TODO: Implement item management routes
  // - GET /items - List saved items with filters
  // - GET /items/:id - Get item details
  // - DELETE /items/:id - Delete item
  
  server.get('/', async () => {
    return { message: 'Items routes - coming soon' };
  });
}
