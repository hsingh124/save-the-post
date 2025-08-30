import { FastifyRequest, FastifyReply } from 'fastify';

export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();
  
  // Log request start
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    userId: 'anonymous' // TODO: Add user authentication
  }, 'Request started');

  // Log response when finished
  // Note: FastifyReply doesn't have addHook, this should be handled at the server level
  // For now, we'll just log the request start
}
