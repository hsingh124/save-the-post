import { FastifyInstance } from 'fastify';

export async function registerNoteRoutes(server: FastifyInstance): Promise<void> {
  // TODO: Implement note routes
  // - POST /items/:id/notes - Add note to item
  // - GET /items/:id/notes - Get notes for item
  // - PUT /notes/:id - Update note
  
  server.get('/', async () => {
    return { message: 'Note routes - coming soon' };
  });
}
