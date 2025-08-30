import axios, { AxiosResponse } from 'axios';
import { RateLimiter, INSTAGRAM_CONFIG, ERROR_MESSAGES } from '@save-the-post/shared';

export interface InstagramOEmbedResponse {
  version: string;
  title: string;
  author_name: string;
  author_url: string;
  author_id: number;
  media_id: string;
  provider_name: string;
  provider_url: string;
  type: string;
  width: number;
  height: number;
  html: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface InstagramPostMetadata {
  postId: string;
  creatorHandle: string;
  creatorId: number;
  mediaType: 'image' | 'video' | 'reel' | 'album';
  title: string;
  embedHtml: string;
  thumbnailUrl?: string;
  dimensions: {
    width: number;
    height: number;
  };
  thumbnailDimensions?: {
    width: number;
    height: number;
  };
}

export class InstagramService {
  private accessToken: string;
  private rateLimiter: RateLimiter;
  private cache: Map<string, { data: InstagramPostMetadata; expiresAt: Date }> = new Map();

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.rateLimiter = new RateLimiter(
      INSTAGRAM_CONFIG.RATE_LIMIT_PER_HOUR * 60 * 1000, // Convert to milliseconds
      INSTAGRAM_CONFIG.RATE_LIMIT_PER_HOUR
    );
  }

  /**
   * Fetch Instagram post metadata via oEmbed API
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

    try {
      const response: AxiosResponse<InstagramOEmbedResponse> = await axios.get(
        INSTAGRAM_CONFIG.OEMBED_ENDPOINT,
        {
          params: {
            url,
            access_token: this.accessToken,
            hidecaption: false,
            maxwidth: 540,
            maxheight: 540,
            omitscript: false
          },
          timeout: 10000, // 10 second timeout
          headers: {
            'User-Agent': 'SaveThePost/1.0 (Instagram oEmbed Client)'
          }
        }
      );

      const metadata = this.parseOEmbedResponse(response.data, url);
      
      // Cache the result
      this.setCache(url, metadata);
      
      return metadata;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(ERROR_MESSAGES.INSTAGRAM_UNAVAILABLE);
        } else if (error.response?.status === 429) {
          throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
        } else if (error.response?.status && error.response.status >= 500) {
          throw new Error('Instagram API temporarily unavailable');
        }
      }
      
      throw new Error(`Failed to fetch Instagram post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse oEmbed response into our metadata format
   */
  private parseOEmbedResponse(response: InstagramOEmbedResponse, url: string): InstagramPostMetadata {
    // Extract post ID from URL
    const postId = this.extractPostId(url);
    
    // Determine media type based on URL path
    const mediaType = this.determineMediaType(url);
    
    // Extract creator handle from author_url
    const creatorHandle = this.extractCreatorHandle(response.author_url);

    return {
      postId: postId || response.media_id,
      creatorHandle: creatorHandle || response.author_name,
      creatorId: response.author_id,
      mediaType,
      title: response.title || 'Instagram Post',
      embedHtml: response.html,
      thumbnailUrl: response.thumbnail_url,
      dimensions: {
        width: response.width,
        height: response.height
      },
      thumbnailDimensions: response.thumbnail_width && response.thumbnail_height ? {
        width: response.thumbnail_width,
        height: response.thumbnail_height
      } : undefined
    };
  }

  /**
   * Extract post ID from Instagram URL
   */
  private extractPostId(url: string): string | null {
    const match = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    return match ? match[2] : null;
  }

  /**
   * Determine media type from URL
   */
  private determineMediaType(url: string): 'image' | 'video' | 'reel' | 'album' {
    if (url.includes('/reel/')) return 'reel';
    if (url.includes('/tv/')) return 'video';
    if (url.includes('/p/')) return 'image'; // Default to image for posts
    return 'image';
  }

  /**
   * Extract creator handle from author URL
   */
  private extractCreatorHandle(authorUrl: string): string | null {
    const match = authorUrl.match(/instagram\.com\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get cached metadata if available and not expired
   */
  private getFromCache(url: string): InstagramPostMetadata | null {
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
    
    // Remove expired cache entry
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
    
    // Clean up expired cache entries periodically
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
 * Factory function to create Instagram service
 */
export function createInstagramService(accessToken: string): InstagramService {
  if (!accessToken) {
    throw new Error('Instagram access token is required');
  }
  
  return new InstagramService(accessToken);
}
