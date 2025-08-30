import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createInstagramService } from '../services/instagram';
import { config } from '../config';
import { isValidInstagramPermalink } from '@save-the-post/shared';

interface IngestRequest {
  Body: {
    url: string;
    userId: string;
    source?: 'manual' | 'telegram' | 'discord' | 'whatsapp' | 'igdm';
  };
}

export async function registerIngestRoutes(server: FastifyInstance): Promise<void> {
  // Create Instagram service
  const instagramService = createInstagramService(config.instagramAccessToken);

  /**
   * POST /ingest
   * Ingest a single Instagram URL
   */
  server.post('/', {
    schema: {
      description: 'Ingest a single Instagram URL',
      tags: ['ingest'],
      body: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'Instagram post URL to ingest'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID for the item'
          },
          source: {
            type: 'string',
            enum: ['manual', 'telegram', 'discord', 'whatsapp', 'igdm'],
            default: 'manual',
            description: 'Source of the URL'
          }
        },
        required: ['url', 'userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            itemId: { type: 'string' },
            message: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                postId: { type: 'string' },
                creatorHandle: { type: 'string' },
                mediaType: { type: 'string' },
                title: { type: 'string' },
                thumbnailUrl: { type: 'string' }
              }
            }
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
  }, async (request: FastifyRequest<IngestRequest>, reply: FastifyReply) => {
    try {
      const { url, userId, source = 'manual' } = request.body;

      // Validate Instagram URL
      if (!isValidInstagramPermalink(url)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid Instagram URL format. Please provide a valid Instagram post, reel, or video URL.'
        });
      }

      // Check if URL is already processed for this user
      // TODO: Check database for existing items
      // const existingItem = await getExistingItem(userId, url);
      // if (existingItem) {
      //   return reply.status(409).send({
      //     error: 'Conflict',
      //     message: 'This Instagram post has already been saved.',
      //     itemId: existingItem.id
      //   });
      // }

      // Fetch Instagram metadata
      server.log.info(`Fetching metadata for Instagram URL: ${url}`);
      const metadata = await instagramService.fetchPostMetadata(url);

      // Create item record
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // TODO: Save to database
      // const item = await createItem({
      //   id: itemId,
      //   userId,
      //   permalink: url,
      //   postId: metadata.postId,
      //   creatorHandle: metadata.creatorHandle,
      //   mediaType: metadata.mediaType,
      //   source,
      //   status: 'active'
      // });

      // TODO: Queue for enrichment
      // await queueEnrichment(itemId);

      server.log.info(`Successfully ingested Instagram post: ${itemId}`);

      return reply.send({
        success: true,
        itemId,
        message: 'Instagram post ingested successfully. It will be processed and enriched shortly.',
        metadata: {
          postId: metadata.postId,
          creatorHandle: metadata.creatorHandle,
          mediaType: metadata.mediaType,
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl
        }
      });

    } catch (error: unknown) {
      server.log.error('Ingest failed');

      if (error instanceof Error) {
        if (error.message.includes('Instagram API temporarily unavailable')) {
          return reply.status(503).send({
            error: 'Service Unavailable',
            message: 'Instagram API is temporarily unavailable. Please try again later.'
          });
        }

        if (error.message.includes('Post is unavailable')) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'This Instagram post is unavailable. It may be private or deleted.'
          });
        }

        if (error.message.includes('Rate limit exceeded')) {
          return reply.status(429).send({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.'
          });
        }
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  /**
   * GET /ingest/validate
   * Validate Instagram URL format without processing
   */
  server.get('/validate', {
    schema: {
      description: 'Validate Instagram URL format',
      tags: ['ingest'],
      querystring: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'Instagram URL to validate'
          }
        },
        required: ['url']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            message: { type: 'string' },
            details: {
              type: 'object',
              properties: {
                postId: { type: 'string' },
                mediaType: { type: 'string' },
                creatorHandle: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { url } = request.query as { url: string };

      if (!url) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'URL parameter is required'
        });
      }

      const isValid = isValidInstagramPermalink(url);

      if (!isValid) {
        return reply.send({
          valid: false,
          message: 'Invalid Instagram URL format. Please provide a valid Instagram post, reel, or video URL.',
          details: null
        });
      }

      // Extract basic info from URL
      const postIdMatch = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
      const mediaType = url.includes('/reel/') ? 'reel' : url.includes('/tv/') ? 'video' : 'image';
      const postId = postIdMatch ? postIdMatch[2] : null;

      return reply.send({
        valid: true,
        message: 'Valid Instagram URL format',
        details: {
          postId,
          mediaType,
          creatorHandle: null // Would need to fetch from Instagram to get this
        }
      });

    } catch (error: unknown) {
      server.log.error('URL validation failed');
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
}
