import { z } from 'zod';

/**
 * Extract Instagram post ID from permalink
 * Supports: /p/, /reel/, /tv/ formats
 */
export function extractInstagramPostId(permalink: string): string | null {
  const match = permalink.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

/**
 * Validate Instagram permalink format
 */
export function isValidInstagramPermalink(url: string): boolean {
  const pattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/;
  return pattern.test(url);
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return text.match(hashtagRegex)?.map(tag => tag.slice(1)) || [];
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  const mentionRegex = /@[\w\u0590-\u05ff]+/g;
  return text.match(mentionRegex)?.map(mention => mention.slice(1)) || [];
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

/**
 * Clean HTML tags from text
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

/**
 * Generate a hash for content to avoid re-processing
 */
export function generateContentHash(content: string): string {
  let hash = 0;
  if (content.length === 0) return hash.toString();
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Normalize text for search indexing
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate text similarity using Jaccard index
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1).split(' '));
  const words2 = new Set(normalizeText(text2).split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Generate search snippet with highlighting
 */
export function generateSearchSnippet(text: string, query: string, maxLength: number = 150): string {
  if (!text || !query) return text || '';
  
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(' ');
  
  // Find the best position to start the snippet
  let bestPosition = 0;
  let bestScore = 0;
  
  for (let i = 0; i < normalizedText.length; i++) {
    let score = 0;
    for (const word of queryWords) {
      if (normalizedText.includes(word, i)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPosition = i;
    }
  }
  
  // Extract snippet around the best position
  const start = Math.max(0, bestPosition - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  
  let snippet = text.slice(start, end);
  
  // Add ellipsis if we're not at the beginning/end
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

/**
 * Validate and sanitize user input
 */
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Generate a random UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Parse Instagram export data
 */
export function parseInstagramExport(data: any): Array<{ permalink: string; saved_at?: string }> {
  try {
    // Handle different export formats
    if (data.saved_posts) {
      return data.saved_posts.map((post: any) => ({
        permalink: post.permalink || post.url,
        saved_at: post.saved_at
      }));
    }
    
    if (Array.isArray(data)) {
      return data.map((post: any) => ({
        permalink: post.permalink || post.url,
        saved_at: post.saved_at
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing Instagram export:', error);
    return [];
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }
    
    const requests = this.requests.get(key)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
  
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}
