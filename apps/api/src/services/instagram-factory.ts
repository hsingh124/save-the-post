import { createInstagramService, InstagramService } from './instagram';
import { createMockInstagramService, MockInstagramService } from './instagram-mock';
import { InstagramServiceBase } from './instagram-base';

/**
 * Factory service that provides either real or mock Instagram service
 * based on configuration availability
 */
export class InstagramServiceFactory {
  private realService: InstagramService | null = null;
  private mockService: MockInstagramService | null = null;
  private isUsingMock: boolean = false;

  constructor(private accessToken: string | null) {
    this.isUsingMock = !accessToken || accessToken.trim() === '';
    
    if (this.isUsingMock) {
      this.mockService = createMockInstagramService();
      console.log('📱 Instagram Service: Using MOCK service (no API key provided)');
    } else if (accessToken && accessToken.trim() !== '') {
      try {
        this.realService = createInstagramService(accessToken);
        console.log('📱 Instagram Service: Using REAL service with API key');
      } catch (error) {
        console.warn('⚠️ Failed to create real Instagram service, falling back to mock:', error);
        this.isUsingMock = true;
        this.mockService = createMockInstagramService();
      }
    } else {
      // No valid token provided, use mock
      this.isUsingMock = true;
      this.mockService = createMockInstagramService();
      console.log('📱 Instagram Service: No valid token provided, using MOCK service');
    }
  }

  /**
   * Get the appropriate Instagram service instance
   */
  getService(): InstagramServiceBase {
    if (this.isUsingMock && this.mockService) {
      return this.mockService;
    }
    
    if (this.realService) {
      return this.realService;
    }
    
    // Fallback to mock if real service failed
    if (!this.mockService) {
      this.mockService = createMockInstagramService();
    }
    
    return this.mockService;
  }

  /**
   * Check if currently using mock service
   */
  isMockMode(): boolean {
    return this.isUsingMock;
  }

  /**
   * Get service status information
   */
  getServiceStatus(): {
    mode: 'real' | 'mock';
    hasAccessToken: boolean;
    serviceType: string;
  } {
    return {
      mode: this.isUsingMock ? 'mock' : 'real',
      hasAccessToken: !this.isUsingMock,
      serviceType: this.isUsingMock ? 'MockInstagramService' : 'InstagramService'
    };
  }

  /**
   * Switch to real service if token becomes available
   */
  switchToRealService(accessToken: string): void {
    if (accessToken && accessToken.trim() !== '') {
      try {
        this.realService = createInstagramService(accessToken);
        this.isUsingMock = false;
        console.log('📱 Instagram Service: Switched to REAL service');
      } catch (error) {
        console.error('❌ Failed to switch to real Instagram service:', error);
      }
    }
  }

  /**
   * Force switch to mock service (useful for testing)
   */
  forceMockMode(): void {
    this.isUsingMock = true;
    if (!this.mockService) {
      this.mockService = createMockInstagramService();
    }
    console.log('📱 Instagram Service: Forced to MOCK mode');
  }
}

/**
 * Factory function to create Instagram service factory
 */
export function createInstagramServiceFactory(accessToken: string | null): InstagramServiceFactory {
  return new InstagramServiceFactory(accessToken);
}

/**
 * Convenience function to get Instagram service directly
 */
export function getInstagramService(accessToken: string | null): InstagramServiceBase {
  const factory = createInstagramServiceFactory(accessToken);
  return factory.getService();
}
