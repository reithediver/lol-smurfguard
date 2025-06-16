import fs from 'fs';
import path from 'path';
import logger from './loggerService';

/**
 * Storage adapter interface for both client and server environments
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Server-side file-based storage implementation
 */
class FileStorageAdapter implements StorageAdapter {
  private storagePath: string;
  private data: Record<string, string> = {};
  private initialized = false;

  constructor(storagePath: string = 'storage') {
    this.storagePath = path.resolve(process.cwd(), storagePath);
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      // Create storage directory if it doesn't exist
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }

      const filePath = path.join(this.storagePath, 'storage.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
      }
      this.initialized = true;
    } catch (error) {
      logger.error('Error loading storage from disk:', error);
      this.data = {};
      this.initialized = true;
    }
  }

  private saveToDisk(): void {
    try {
      const filePath = path.join(this.storagePath, 'storage.json');
      fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Error saving storage to disk:', error);
    }
  }

  getItem(key: string): string | null {
    if (!this.initialized) this.loadFromDisk();
    return this.data[key] || null;
  }

  setItem(key: string, value: string): void {
    if (!this.initialized) this.loadFromDisk();
    this.data[key] = value;
    this.saveToDisk();
  }

  removeItem(key: string): void {
    if (!this.initialized) this.loadFromDisk();
    delete this.data[key];
    this.saveToDisk();
  }

  clear(): void {
    this.data = {};
    this.saveToDisk();
  }
}

// Since we're primarily running in Node.js for now,
// we'll just use the FileStorageAdapter
// When we add the frontend, we can implement a proper browser adapter

// Export a singleton instance
export const storage: StorageAdapter = new FileStorageAdapter(); 