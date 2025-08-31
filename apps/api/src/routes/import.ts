import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createImportService } from '../services/import';
import { getInstagramService } from '../services/instagram-factory';
import { config } from '../config';
import { JobSchema as ImportJobSchema } from '@save-the-post/shared';

interface ImportRequest {
  Body: {
    file: MultipartFile;
  };
  Querystring: {
    userId: string;
  };
}

interface ImportStatusRequest {
  Params: {
    id: string;
  };
}

export async function registerImportRoutes(server: FastifyInstance): Promise<void> {
  // Create services
  const instagramService = getInstagramService(config.instagramAccessToken);
  const importService = createImportService(instagramService);

  // Ensure upload directory exists
  try {
    await mkdir(config.uploadDir, { recursive: true });
      } catch (error: unknown) {
      server.log.error('Failed to create upload directory');
    }

  /**
   * POST /import
   * Upload and process Instagram data export
   */
  server.post('/', {
    schema: {
      description: 'Upload Instagram data export file',
      tags: ['import'],
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary'
          }
        },
        required: ['file']
      },
      querystring: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID for the import'
          }
        },
        required: ['userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            jobId: { type: 'string' },
            message: { type: 'string' },
            totalItems: { type: 'number' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<ImportRequest>, reply: FastifyReply) => {
    try {
      const { file } = request.body;
      const { userId } = request.query;

      if (!file) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      // Validate file type
      const allowedTypes = ['.json', '.zip'];
      const fileExtension = file.filename ? file.filename.split('.').pop()?.toLowerCase() : '';
      
      if (!fileExtension || !allowedTypes.includes(`.${fileExtension}`)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        });
      }

      // Save file to upload directory
      const uploadPath = join(config.uploadDir, `${Date.now()}-${file.filename}`);
      const buffer = await file.toBuffer();
      await writeFile(uploadPath, buffer);

      server.log.info(`File uploaded: ${uploadPath} (${buffer.length} bytes)`);

      // Process the export file
      const job = await importService.processExport(userId, uploadPath, file.filename);

      return reply.send({
        success: true,
        jobId: job.id,
        message: `Import job started. Processing ${job.totalItems} items.`,
        totalItems: job.totalItems
      });

    } catch (error: unknown) {
      server.log.error('Import failed');
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  /**
   * GET /import/:id/status
   * Get import job status and progress
   */
  server.get('/:id/status', {
    schema: {
      description: 'Get import job status and progress',
      tags: ['import'],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Import job ID'
          }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            status: { type: 'string' },
            totalItems: { type: 'number' },
            processedItems: { type: 'number' },
            successfulItems: { type: 'number' },
            failedItems: { type: 'number' },
            progress: { type: 'number' },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'string' }
            },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
            estimatedCompletionTime: { type: 'number' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<ImportStatusRequest>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      // TODO: Get job from database instead of in-memory storage
      // For now, return a mock response
      const mockJob = {
        id,
        userId: 'mock-user-id',
        filename: 'mock-export.json',
        status: 'processing' as const,
        totalItems: 100,
        processedItems: 45,
        successfulItems: 42,
        failedItems: 3,
        startedAt: new Date(Date.now() - 300000), // 5 minutes ago
        errors: ['Failed to process post: Post is private']
      };

      const progress = Math.round((mockJob.processedItems / mockJob.totalItems) * 100);
      const estimatedTime = importService.estimateCompletionTime(mockJob);
      const statusMessage = importService.getJobStatus(mockJob);

      return reply.send({
        jobId: mockJob.id,
        status: mockJob.status,
        totalItems: mockJob.totalItems,
        processedItems: mockJob.processedItems,
        successfulItems: mockJob.successfulItems,
        failedItems: mockJob.failedItems,
        progress,
        message: statusMessage,
        errors: mockJob.errors,
        startedAt: mockJob.startedAt.toISOString(),
        estimatedCompletionTime: estimatedTime
      });

    } catch (error: unknown) {
      server.log.error('Failed to get import status');
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  /**
   * GET /import
   * List import jobs for a user
   */
  server.get('/', {
    schema: {
      description: 'List import jobs for a user',
      tags: ['import'],
      querystring: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID to get imports for'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Number of jobs to return'
          },
          offset: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Number of jobs to skip'
          }
        },
        required: ['userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  user_id: { type: 'string', format: 'uuid' },
                  type: { type: 'string', enum: ['hydrate', 'tag', 'embed', 'import'] },
                  payload: { type: 'object' },
                  status: { type: 'string', enum: ['queued', 'running', 'done', 'error'] },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'type', 'payload', 'status', 'created_at', 'updated_at']
              }
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' }
          },
          required: ['jobs', 'total', 'limit', 'offset']
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, limit = 20, offset = 0 } = request.query as any;

      // TODO: Get jobs from database
      // For now, return empty list
      return reply.send({
        jobs: [],
        total: 0,
        limit,
        offset
      });

    } catch (error: unknown) {
      server.log.error('Failed to list import jobs');
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
}
