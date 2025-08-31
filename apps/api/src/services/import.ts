import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';
import { extname } from 'path';
import { parseInstagramExport, isValidInstagramPermalink, generateUUID } from '@save-the-post/shared';
import { UPLOAD_LIMITS, ERROR_MESSAGES } from '@save-the-post/shared';
import { InstagramServiceBase } from './instagram-base';
import { InstagramPostMetadata } from './instagram';

export interface ImportJob {
  id: string;
  userId: string;
  filename: string;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  status: 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  errors: string[];
}

export interface ImportResult {
  jobId: string;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  errors: string[];
  estimatedCompletionTime?: number; // in minutes
}

export interface ImportedItem {
  permalink: string;
  savedAt?: Date;
  metadata?: InstagramPostMetadata;
  error?: string;
}

export class ImportService {
  private instagramService: InstagramServiceBase;

  constructor(instagramService: InstagramServiceBase) {
    this.instagramService = instagramService;
  }

  /**
   * Process Instagram data export file
   */
  async processExport(
    userId: string,
    filePath: string,
    filename: string
  ): Promise<ImportJob> {
    // Validate file
    await this.validateFile(filePath, filename);

    // Create import job
    const job: ImportJob = {
      id: generateUUID(),
      userId,
      filename,
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      status: 'processing',
      startedAt: new Date(),
      errors: []
    };

    try {
      // Parse the export file
      const items = await this.parseExportFile(filePath);
      job.totalItems = items.length;

      // Process items in batches
      const batchSize = 50; // Process 50 items at a time
      const batches = this.chunkArray(items, batchSize);

      for (const batch of batches) {
        const batchResults = await this.processBatch(batch);
        
        // Update job progress
        job.processedItems += batch.length;
        job.successfulItems += batchResults.successfulItems;
        job.failedItems += batchResults.failedItems;
        job.errors.push(...batchResults.errors);

        // Add small delay between batches to avoid overwhelming APIs
        await this.delay(1000);
      }

      job.status = 'completed';
      job.completedAt = new Date();

    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return job;
  }

  /**
   * Process a batch of items
   */
  private async processBatch(items: Array<{ permalink: string; savedAt?: string }>) {
    const results = {
      successfulItems: 0,
      failedItems: 0,
      errors: [] as string[]
    };

    const promises = items.map(async (item) => {
      try {
        // Validate Instagram URL
        if (!isValidInstagramPermalink(item.permalink)) {
          throw new Error(`Invalid Instagram URL: ${item.permalink}`);
        }

        // Fetch metadata from Instagram
        const metadata = await this.instagramService.fetchPostMetadata(item.permalink);
        
        // TODO: Save to database
        // await this.saveItem(item, metadata);
        
        results.successfulItems++;
      } catch (error) {
        results.failedItems++;
        results.errors.push(`Failed to process ${item.permalink}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Parse export file (ZIP or JSON)
   */
  private async parseExportFile(filePath: string): Promise<Array<{ permalink: string; savedAt?: string }>> {
    const extension = extname(filePath).toLowerCase();

    if (extension === '.zip') {
      return this.parseZipFile(filePath);
    } else if (extension === '.json') {
      return this.parseJsonFile(filePath);
    } else {
      throw new Error(`Unsupported file format: ${extension}. Only .zip and .json files are supported.`);
    }
  }

  /**
   * Parse ZIP file containing Instagram export
   */
  private async parseZipFile(filePath: string): Promise<Array<{ permalink: string; savedAt?: string }>> {
    try {
      // For now, we'll assume the ZIP contains a JSON file
      // In a real implementation, you'd use a ZIP library like 'unzipper' or 'adm-zip'
      throw new Error('ZIP file parsing not yet implemented. Please use JSON export for now.');
    } catch (error) {
      throw new Error(`Failed to parse ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse JSON file containing Instagram export
   */
  private async parseJsonFile(filePath: string): Promise<Array<{ permalink: string; savedAt?: string }>> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      return parseInstagramExport(data);
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate uploaded file
   */
  private async validateFile(filePath: string, filename: string): Promise<void> {
    const extension = extname(filename).toLowerCase();
    
    // Check file format
    if (!UPLOAD_LIMITS.ALLOWED_FORMATS.includes(extension as '.zip' | '.json')) {
      throw new Error(`Unsupported file format: ${extension}. Allowed formats: ${UPLOAD_LIMITS.ALLOWED_FORMATS.join(', ')}`);
    }

    // Check file size
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > UPLOAD_LIMITS.MAX_FILE_SIZE_MB) {
      throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size: ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB`);
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate completion time based on current progress
   */
  estimateCompletionTime(job: ImportJob): number | undefined {
    if (job.processedItems === 0 || job.status !== 'processing') {
      return undefined;
    }

    const elapsedMs = Date.now() - job.startedAt.getTime();
    const itemsPerMs = job.processedItems / elapsedMs;
    const remainingItems = job.totalItems - job.processedItems;
    const remainingMs = remainingItems / itemsPerMs;
    
    return Math.ceil(remainingMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Get import job status
   */
  getJobStatus(job: ImportJob): string {
    if (job.status === 'completed') {
      return `Completed: ${job.successfulItems}/${job.totalItems} items imported successfully`;
    } else if (job.status === 'failed') {
      return `Failed: ${job.errors.length} errors occurred`;
    } else {
      const progress = Math.round((job.processedItems / job.totalItems) * 100);
      const estimatedTime = this.estimateCompletionTime(job);
      const timeStr = estimatedTime ? ` (est. ${estimatedTime} min remaining)` : '';
      return `Processing: ${progress}% complete${timeStr}`;
    }
  }
}

/**
 * Factory function to create import service
 */
export function createImportService(instagramService: InstagramServiceBase): ImportService {
  return new ImportService(instagramService);
}
