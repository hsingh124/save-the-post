import { InstagramPostMetadata, InstagramOEmbedResponse } from './instagram';
import { RateLimiter, INSTAGRAM_CONFIG, ERROR_MESSAGES } from '@save-the-post/shared';
import { InstagramServiceBase } from './instagram-base';

/**
 * Mock Instagram service that generates realistic data without requiring an API key
 * This allows development to continue while waiting for Instagram API access
 */
export class MockInstagramService implements InstagramServiceBase {
  private rateLimiter: RateLimiter;
  private cache: Map<string, { data: InstagramPostMetadata; expiresAt: Date }> = new Map();
  private mockCreators = [
    'foodie_adventures',
    'fitness_guru',
    'tech_tips_daily',
    'travel_vibes',
    'design_inspiration',
    'coding_master',
    'health_wellness',
    'creative_corner',
    'lifestyle_guide',
    'beauty_tips'
  ];

  private mockTopics = [
    'recipes', 'fitness', 'coding', 'career', 'design', 'travel',
    'finance', 'photography', 'DIY', 'health', 'inspiration', 'fashion'
  ];

  constructor() {
    this.rateLimiter = new RateLimiter(
      INSTAGRAM_CONFIG.RATE_LIMIT_PER_HOUR * 60 * 1000,
      INSTAGRAM_CONFIG.RATE_LIMIT_PER_HOUR
    );
  }

  /**
   * Generate mock Instagram post metadata
   */
  async fetchPostMetadata(url: string): Promise<InstagramPostMetadata> {
    // Check cache first
    const cached = this.getFromCache(url);
    if (cached) {
      return cached;
    }

    // Check rate limiting
    if (!this.rateLimiter.isAllowed('instagram_api')) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
    }

    // Simulate API delay
    await this.simulateApiDelay();

    const metadata = this.generateMockMetadata(url);
    
    // Cache the result
    this.setCache(url, metadata);
    
    return metadata;
  }

  /**
   * Generate realistic mock metadata based on URL
   */
  private generateMockMetadata(url: string): InstagramPostMetadata {
    const postId = this.extractPostId(url) || this.generateMockPostId();
    const mediaType = this.determineMediaType(url);
    const creatorHandle = this.selectRandomCreator();
    const topic = this.selectRandomTopic();
    
    // Generate realistic caption based on topic
    const caption = this.generateMockCaption(topic, creatorHandle);
    
    // Generate mock embed HTML
    const embedHtml = this.generateMockEmbedHtml(postId, creatorHandle, mediaType);
    
    // Generate mock thumbnail URL
    const thumbnailUrl = this.generateMockThumbnailUrl(postId, mediaType);

    return {
      postId,
      creatorHandle,
      creatorId: this.generateMockCreatorId(),
      mediaType,
      title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} by ${creatorHandle}`,
      embedHtml,
      thumbnailUrl,
      dimensions: {
        width: mediaType === 'video' || mediaType === 'reel' ? 1080 : 1080,
        height: mediaType === 'video' || mediaType === 'reel' ? 1920 : 1080
      },
      thumbnailDimensions: {
        width: 320,
        height: mediaType === 'video' || mediaType === 'reel' ? 568 : 320
      }
    };
  }

  /**
   * Generate realistic mock caption based on topic
   */
  private generateMockCaption(topic: string, creatorHandle: string): string {
    const captions = {
      recipes: [
        `🍳 Quick and easy recipe that will change your life! Perfect for busy weeknights. What's your favorite go-to meal? #${topic} #quickmeals #${creatorHandle}`,
        `👨‍🍳 This recipe has been in my family for generations. The secret ingredient? Love and patience! #${topic} #familyrecipes #${creatorHandle}`,
        `🥘 5-ingredient wonder that tastes like it took hours to make. Sometimes simple is best! #${topic} #simplecooking #${creatorHandle}`
      ],
      fitness: [
        `💪 Transform your body with this 15-minute workout! No equipment needed, just determination. #${topic} #homeworkout #${creatorHandle}`,
        `🏃‍♀️ Running tips that helped me go from couch to 5K in just 8 weeks! #${topic} #running #${creatorHandle}`,
        `🧘‍♀️ Morning routine that sets the tone for the entire day. Start your day right! #${topic} #morningroutine #${creatorHandle}`
      ],
      coding: [
        `💻 Pro tip: Always comment your code as if the next developer is a psychopath who knows where you live! #${topic} #coding #${creatorHandle}`,
        `🚀 This debugging technique saved me hours of frustration. Share it with your team! #${topic} #debugging #${creatorHandle}`,
        `⚡ Performance optimization that made our app 10x faster. Sometimes the best code is no code! #${topic} #performance #${creatorHandle}`
      ],
      travel: [
        `✈️ Hidden gem that most tourists miss! This place changed my perspective on travel. #${topic} #travel #${creatorHandle}`,
        `🌍 Budget travel tips that let me explore the world on a shoestring! #${topic} #budgettravel #${creatorHandle}`,
        `🏔️ Mountain views that made me question everything I thought I knew about beauty! #${topic} #mountains #${creatorHandle}`
      ]
    };

    const topicCaptions = captions[topic as keyof typeof captions] || captions.travel;
    return topicCaptions[Math.floor(Math.random() * topicCaptions.length)];
  }

  /**
   * Generate mock embed HTML
   */
  private generateMockEmbedHtml(postId: string, creatorHandle: string, mediaType: string): string {
    const mediaContent = mediaType === 'video' || mediaType === 'reel' 
      ? `<video controls width="540" height="960"><source src="https://example.com/mock-video-${postId}.mp4" type="video/mp4"></video>`
      : `<img src="https://example.com/mock-image-${postId}.jpg" width="540" height="540" alt="Instagram post by ${creatorHandle}">`;

    return `
      <div class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${postId}/" data-instgrm-version="14">
        <div style="background:#FFF; border:1px solid #dbdbdb; border-radius:3px; max-width:540px; min-width:326px; padding:0; width:99.375%;">
          <div style="padding:16px;">
            <a href="https://www.instagram.com/p/${postId}/" style="background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank">
              ${mediaContent}
            </a>
            <p style="color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;">
              <a href="https://www.instagram.com/p/${postId}/" style="color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;" target="_blank">View this post on Instagram</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate mock thumbnail URL
   */
  private generateMockThumbnailUrl(postId: string, mediaType: string): string {
    const dimensions = mediaType === 'video' || mediaType === 'reel' ? '320x568' : '320x320';
    return `https://example.com/mock-thumbnails/${postId}-${dimensions}.jpg`;
  }

  /**
   * Extract post ID from Instagram URL
   */
  private extractPostId(url: string): string | null {
    const match = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    return match ? match[2] : null;
  }

  /**
   * Generate mock post ID if extraction fails
   */
  private generateMockPostId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let result = '';
    for (let i = 0; i < 11; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Determine media type from URL
   */
  private determineMediaType(url: string): 'image' | 'video' | 'reel' | 'album' {
    if (url.includes('/reel/')) return 'reel';
    if (url.includes('/tv/')) return 'video';
    if (url.includes('/p/')) return 'image';
    return 'image';
  }

  /**
   * Select random creator from predefined list
   */
  private selectRandomCreator(): string {
    return this.mockCreators[Math.floor(Math.random() * this.mockCreators.length)];
  }

  /**
   * Select random topic from predefined list
   */
  private selectRandomTopic(): string {
    return this.mockTopics[Math.floor(Math.random() * this.mockTopics.length)];
  }

  /**
   * Generate mock creator ID
   */
  private generateMockCreatorId(): number {
    return Math.floor(Math.random() * 1000000000) + 100000000;
  }

  /**
   * Simulate API delay for realistic behavior
   */
  private async simulateApiDelay(): Promise<void> {
    const delay = Math.random() * 200 + 100; // 100-300ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get cached metadata if available and not expired
   */
  private getFromCache(url: string): InstagramPostMetadata | null {
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(url);
    }
    
    return null;
  }

  /**
   * Set cache with expiration
   */
  private setCache(url: string, metadata: InstagramPostMetadata): void {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INSTAGRAM_CONFIG.CACHE_TTL_HOURS);
    
    this.cache.set(url, { data: metadata, expiresAt });
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = new Date();
    for (const [url, cached] of this.cache.entries()) {
      if (cached.expiresAt <= now) {
        this.cache.delete(url);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

/**
 * Factory function to create mock Instagram service
 */
export function createMockInstagramService(): MockInstagramService {
  return new MockInstagramService();
}
