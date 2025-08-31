import { isValidInstagramPermalink, generateUUID } from '@save-the-post/shared';
import { InstagramServiceBase } from './instagram-base';
import { InstagramPostMetadata } from './instagram';
import { BOT_PATTERNS, ERROR_MESSAGES } from '@save-the-post/shared';

export interface BotMessage {
  id: string;
  platform: 'telegram' | 'discord' | 'whatsapp' | 'igdm';
  userId: string;
  username?: string;
  message: string;
  timestamp: Date;
  chatId?: string;
  channelId?: string;
}

export interface BotResponse {
  success: boolean;
  message: string;
  itemId?: string;
  error?: string;
}

export interface CapturedItem {
  id: string;
  permalink: string;
  userId: string;
  platform: string;
  metadata?: InstagramPostMetadata;
  error?: string;
  capturedAt: Date;
}

export class BotService {
  private instagramService: InstagramServiceBase;
  private capturedItems: Map<string, CapturedItem> = new Map();

  constructor(instagramService: InstagramServiceBase) {
    this.instagramService = instagramService;
  }

  /**
   * Process message from Telegram bot
   */
  async processTelegramMessage(message: any): Promise<BotResponse> {
    try {
      const botMessage: BotMessage = {
        id: generateUUID(),
        platform: 'telegram',
        userId: message.from.id.toString(),
        username: message.from.username,
        message: message.text || '',
        timestamp: new Date(message.date * 1000),
        chatId: message.chat.id.toString()
      };

      return await this.processMessage(botMessage);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process Telegram message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process message from Discord bot
   */
  async processDiscordMessage(message: any): Promise<BotResponse> {
    try {
      const botMessage: BotMessage = {
        id: generateUUID(),
        platform: 'discord',
        userId: message.author.id,
        username: message.author.username,
        message: message.content || '',
        timestamp: new Date(),
        channelId: message.channel_id
      };

      return await this.processMessage(botMessage);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process Discord message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process message from WhatsApp Business
   */
  async processWhatsAppMessage(message: any): Promise<BotResponse> {
    try {
      const botMessage: BotMessage = {
        id: generateUUID(),
        platform: 'whatsapp',
        userId: message.from,
        message: message.text?.body || '',
        timestamp: new Date(message.timestamp * 1000)
      };

      return await this.processMessage(botMessage);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process WhatsApp message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process message from Instagram DM
   */
  async processInstagramMessage(message: any): Promise<BotResponse> {
    try {
      const botMessage: BotMessage = {
        id: generateUUID(),
        platform: 'igdm',
        userId: message.sender_id.toString(),
        message: message.text || '',
        timestamp: new Date()
      };

      return await this.processMessage(botMessage);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process Instagram message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process bot message and extract Instagram URLs
   */
  private async processMessage(botMessage: BotMessage): Promise<BotResponse> {
    // Extract URLs from message
    const urls = this.extractUrls(botMessage.message);
    
    if (urls.length === 0) {
      return {
        success: false,
        message: 'No Instagram URLs found in message. Please send an Instagram post link.',
        error: 'NO_URLS_FOUND'
      };
    }

    // Find Instagram URLs
    const instagramUrls = urls.filter(url => isValidInstagramPermalink(url));
    
    if (instagramUrls.length === 0) {
      return {
        success: false,
        message: 'No valid Instagram URLs found. Please send a valid Instagram post link.',
        error: 'NO_INSTAGRAM_URLS'
      };
    }

    // Process the first Instagram URL found
    const url = instagramUrls[0];
    
    try {
      // Check if we've already processed this URL for this user
      const existingItem = this.findExistingItem(botMessage.userId, url);
      if (existingItem) {
        return {
          success: true,
          message: `You've already saved this post! It's available in your dashboard.`,
          itemId: existingItem.id
        };
      }

      // Fetch Instagram metadata
      const metadata = await this.instagramService.fetchPostMetadata(url);
      
      // Create captured item
      const capturedItem: CapturedItem = {
        id: generateUUID(),
        permalink: url,
        userId: botMessage.userId,
        platform: botMessage.platform,
        metadata,
        capturedAt: new Date()
      };

      // Store the item (in a real app, this would go to the database)
      this.capturedItems.set(capturedItem.id, capturedItem);

      // TODO: Save to database and queue for enrichment
      // await this.saveItem(capturedItem);
      // await this.queueEnrichment(capturedItem.id);

      return {
        success: true,
        message: `✅ Instagram post captured! I'll process it and add it to your dashboard.`,
        itemId: capturedItem.id
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        message: `Failed to process Instagram post: ${errorMessage}`,
        error: errorMessage
      };
    }
  }

  /**
   * Extract URLs from text message
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Find existing item for user and URL
   */
  private findExistingItem(userId: string, permalink: string): CapturedItem | undefined {
    for (const item of this.capturedItems.values()) {
      if (item.userId === userId && item.permalink === permalink) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Get captured items for a user
   */
  getUserItems(userId: string): CapturedItem[] {
    return Array.from(this.capturedItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  }

  /**
   * Get captured item by ID
   */
  getItem(itemId: string): CapturedItem | undefined {
    return this.capturedItems.get(itemId);
  }

  /**
   * Delete captured item
   */
  deleteItem(itemId: string, userId: string): boolean {
    const item = this.capturedItems.get(itemId);
    if (item && item.userId === userId) {
      this.capturedItems.delete(itemId);
      return true;
    }
    return false;
  }

  /**
   * Get statistics for bot service
   */
  getStats(): {
    totalItems: number;
    totalUsers: number;
    platformBreakdown: Record<string, number>;
  } {
    const users = new Set<string>();
    const platformCounts: Record<string, number> = {};

    for (const item of this.capturedItems.values()) {
      users.add(item.userId);
      platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
    }

    return {
      totalItems: this.capturedItems.size,
      totalUsers: users.size,
      platformBreakdown: platformCounts
    };
  }

  /**
   * Clear all captured items (for testing/reset)
   */
  clearAll(): void {
    this.capturedItems.clear();
  }
}

/**
 * Factory function to create bot service
 */
export function createBotService(instagramService: InstagramServiceBase): BotService {
  return new BotService(instagramService);
}
