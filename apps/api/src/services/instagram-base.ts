import { InstagramPostMetadata } from './instagram';

/**
 * Base interface for Instagram services
 * This allows both real and mock services to be used interchangeably
 */
export interface InstagramServiceBase {
  /**
   * Fetch Instagram post metadata
   */
  fetchPostMetadata(url: string): Promise<InstagramPostMetadata>;
  
  /**
   * Clear all cached data
   */
  clearCache(): void;
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number };
}

/**
 * Type guard to check if a service implements the base interface
 */
export function isInstagramServiceBase(service: any): service is InstagramServiceBase {
  return (
    typeof service === 'object' &&
    service !== null &&
    typeof service.fetchPostMetadata === 'function' &&
    typeof service.clearCache === 'function' &&
    typeof service.getCacheStats === 'function'
  );
}
