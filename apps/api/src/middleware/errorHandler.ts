import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ERROR_MESSAGES } from '@save-the-post/shared';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log the error
  request.log.error(error);

  // Handle specific error types
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      details: error.validation
    });
    return;
  }

  if (error.statusCode === 429) {
    reply.status(429).send({
      error: 'Rate Limit Exceeded',
      message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    });
    return;
  }

  if (error.statusCode === 404) {
    reply.status(404).send({
      error: 'Not Found',
      message: ERROR_MESSAGES.ITEM_NOT_FOUND
    });
    return;
  }

  if (error.statusCode === 401) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
    return;
  }

  if (error.statusCode === 403) {
    reply.status(403).send({
      error: 'Forbidden',
      message: ERROR_MESSAGES.FORBIDDEN
    });
    return;
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;

  reply.status(statusCode).send({
    error: 'Internal Server Error',
    message: statusCode === 500 ? ERROR_MESSAGES.INTERNAL_ERROR : message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}
