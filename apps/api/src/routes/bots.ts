import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createBotService } from '../services/bots';
import { getInstagramService } from '../services/instagram-factory';
import { config } from '../config';

interface TelegramWebhookRequest {
  Body: {
    update_id: number;
    message?: {
      message_id: number;
      from: {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
      };
      chat: {
        id: number;
        type: string;
      };
      date: number;
      text?: string;
    };
  };
}

interface DiscordWebhookRequest {
  Body: {
    type: number;
    data?: {
      content?: string;
      author?: {
        id: string;
        username: string;
      };
      channel_id?: string;
    };
  };
}

interface WhatsAppWebhookRequest {
  Body: {
    object: string;
    entry: Array<{
      id: string;
      changes: Array<{
        value: {
          messaging_product: string;
          metadata: {
            display_phone_number: string;
            phone_number_id: string;
          };
          contacts: Array<{
            profile: {
              name: string;
            };
            wa_id: string;
          }>;
          messages: Array<{
            from: string;
            id: string;
            timestamp: string;
            type: string;
            text?: {
              body: string;
            };
          }>;
        };
      }>;
    }>;
  };
}

export async function registerBotRoutes(server: FastifyInstance): Promise<void> {
  // Create services
  const instagramService = getInstagramService(config.instagramAccessToken);
  const botService = createBotService(instagramService);

  /**
   * POST /webhook/telegram
   * Telegram bot webhook endpoint
   */
  server.post('/telegram', {
    schema: {
      description: 'Telegram bot webhook endpoint',
      tags: ['bots'],
      body: {
        type: 'object',
        properties: {
          update_id: { type: 'number' },
          message: {
            type: 'object',
            properties: {
              message_id: { type: 'number' },
              from: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  username: { type: 'string' },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' }
                }
              },
              chat: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  type: { type: 'string' }
                }
              },
              date: { type: 'number' },
              text: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<TelegramWebhookRequest>, reply: FastifyReply) => {
    try {
      const { message } = request.body;

      if (!message || !message.text) {
        return reply.send({
          success: true,
          message: 'No text message received'
        });
      }

      server.log.info(`Telegram message received from ${message.from.username || message.from.id}: ${message.text}`);

      // Process the message
      const response = await botService.processTelegramMessage(message);

      // TODO: Send response back to Telegram user via Telegram Bot API
      // For now, just log the response
      server.log.info(`Telegram response: ${response.message}`);

      return reply.send({
        success: true,
        message: 'Message processed successfully'
      });

    } catch (error: unknown) {
      server.log.error('Telegram webhook failed');
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to process Telegram message'
      });
    }
  });

  /**
   * POST /webhook/discord
   * Discord bot webhook endpoint
   */
  server.post('/discord', {
    schema: {
      description: 'Discord bot webhook endpoint',
      tags: ['bots'],
      body: {
        type: 'object',
        properties: {
          type: { type: 'number' },
          data: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' }
                }
              },
              channel_id: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<DiscordWebhookRequest>, reply: FastifyReply) => {
    try {
      const { data } = request.body;

      if (!data || !data.content) {
        return reply.send({
          success: true,
          message: 'No content received'
        });
      }

      server.log.info(`Discord message received from ${data.author?.username || 'unknown'}: ${data.content}`);

      // Process the message
      const response = await botService.processDiscordMessage(request.body);

      // TODO: Send response back to Discord user via Discord Bot API
      // For now, just log the response
      server.log.info(`Discord response: ${response.message}`);

      return reply.send({
        success: true,
        message: 'Message processed successfully'
      });

    } catch (error: unknown) {
      server.log.error('Discord webhook failed');
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to process Discord message'
      });
    }
  });

  /**
   * POST /webhook/whatsapp
   * WhatsApp Business webhook endpoint
   */
  server.post('/whatsapp', {
    schema: {
      description: 'WhatsApp Business webhook endpoint',
      tags: ['bots'],
      body: {
        type: 'object',
        properties: {
          object: { type: 'string' },
          entry: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                changes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      value: {
                        type: 'object',
                        properties: {
                          messaging_product: { type: 'string' },
                          metadata: {
                            type: 'object',
                            properties: {
                              display_phone_number: { type: 'string' },
                              phone_number_id: { type: 'string' }
                            }
                          },
                          contacts: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                profile: {
                                  type: 'object',
                                  properties: {
                                    name: { type: 'string' }
                                  }
                                },
                                wa_id: { type: 'string' }
                              }
                            }
                          },
                          messages: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                from: { type: 'string' },
                                id: { type: 'string' },
                                timestamp: { type: 'string' },
                                type: { type: 'string' },
                                text: {
                                  type: 'object',
                                  properties: {
                                    body: { type: 'string' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<WhatsAppWebhookRequest>, reply: FastifyReply) => {
    try {
      const { entry } = request.body;

      if (!entry || entry.length === 0) {
        return reply.send({
          success: true,
          message: 'No entry received'
        });
      }

      // Process each entry
      for (const entryItem of entry) {
        for (const change of entryItem.changes) {
          const { messages } = change.value;
          
          if (messages && messages.length > 0) {
            for (const message of messages) {
              if (message.type === 'text' && message.text?.body) {
                server.log.info(`WhatsApp message received from ${message.from}: ${message.text.body}`);
                
                // Process the message
                const response = await botService.processWhatsAppMessage(message);
                
                // TODO: Send response back to WhatsApp user via WhatsApp Business API
                // For now, just log the response
                server.log.info(`WhatsApp response: ${response.message}`);
              }
            }
          }
        }
      }

      return reply.send({
        success: true,
        message: 'Messages processed successfully'
      });

    } catch (error: unknown) {
      server.log.error('WhatsApp webhook failed');
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to process WhatsApp message'
      });
    }
  });

  /**
   * GET /webhook/telegram
   * Telegram webhook verification (for setting up webhook)
   */
  server.get('/telegram', async (request: FastifyRequest, reply: FastifyReply) => {
    const { url } = request.query as { url?: string };
    
    if (url) {
      // TODO: Set up Telegram webhook with the provided URL
      server.log.info(`Setting up Telegram webhook with URL: ${url}`);
      
      return reply.send({
        success: true,
        message: 'Telegram webhook setup initiated'
      });
    }
    
    return reply.send({
      success: true,
      message: 'Telegram webhook endpoint is active'
    });
  });

  /**
   * GET /webhook/discord
   * Discord webhook verification
   */
  server.get('/discord', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      message: 'Discord webhook endpoint is active'
    });
  });

  /**
   * GET /webhook/whatsapp
   * WhatsApp webhook verification
   */
  server.get('/whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query as any;
    
    if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
      server.log.info('WhatsApp webhook verified');
      return reply.send(challenge);
    }
    
    return reply.status(403).send({
      success: false,
      message: 'WhatsApp webhook verification failed'
    });
  });

  /**
   * GET /webhook/stats
   * Get bot service statistics
   */
  server.get('/stats', {
    schema: {
      description: 'Get bot service statistics',
      tags: ['bots'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            totalUsers: { type: 'number' },
            platformBreakdown: {
              type: 'object',
              additionalProperties: { type: 'number' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = botService.getStats();
      
      return reply.send(stats);
    } catch (error: unknown) {
      server.log.error('Failed to get bot stats');
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve bot statistics'
      });
    }
  });
}
