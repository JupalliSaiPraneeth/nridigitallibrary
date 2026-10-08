import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { resolveSafeBookPath } from '../middleware/safePathResolver.js';
import { logger } from '../utils/logger.js';

// In-memory catalog cache mapping secure book IDs to relative file paths
let bookCatalogCache = [];
let bookIdToPathMap = new Map();
let activeStorageRoot = null;

export function getActiveStorageRoot() {
  if (activeStorageRoot && fs.existsSync(activeStorageRoot)) {
    try {
      const testFiles = fs.readdirSync(activeStorageRoot);
      if (testFiles.some(f => config.allowedExtensions.includes(path.extname(f).toLowerCase()))) {
        return activeStorageRoot;
      }
    } catch (e) {}
  }

  const candidateFolders = [
    config.bookStoragePath,
    'C:\\e book',
    'C:\\Users\\jupal\\Downloads\\books',
    path.resolve('storage'),
    path.resolve('backend/storage'),
    path.resolve('books')
  ].filter(Boolean);

  for (const folder of candidateFolders) {
    if (fs.existsSync(folder)) {
      try {
        const files = fs.readdirSync(folder);
        if (files.some(f => config.allowedExtensions.includes(path.extname(f).toLowerCase()))) {
          activeStorageRoot = path.resolve(folder);
          return activeStorageRoot;
        }
      } catch (e) {}
    }
  }

  activeStorageRoot = path.resolve(config.bookStoragePath || 'C:\\e book');
  if (!fs.existsSync(activeStorageRoot)) {
    try {
      fs.mkdirSync(activeStorageRoot, { recursive: true });
    } catch (e) {
      logger.error('Failed to create storage directory', e);
    }
  }
  return activeStorageRoot;
}

/**
 * Scans storage directory recursively for supported books.
 */
export function scanBookStorage() {
  const rootDir = getActiveStorageRoot();
  bookCatalogCache = [];
  bookIdToPathMap.clear();

  if (!fs.existsSync(rootDir)) {
    return [];
  }

  function walk(currentDir) {
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (e) {
      logger.error(`Failed to read directory ${currentDir}`, e);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (config.allowedExtensions.includes(ext)) {
          const relativePath = path.relative(rootDir, fullPath);
          const category = path.dirname(relativePath) !== '.' ? path.dirname(relativePath) : 'General Curriculum';
          const title = path.basename(entry.name, ext).trim();
          
          // Generate deterministic secure ID based on relative path hash
          const id = crypto.createHash('sha256').update(relativePath).digest('hex').substring(0, 16);
          
          let fileSize = 0;
          try {
            fileSize = fs.statSync(fullPath).size;
          } catch (e) {}

          const bookMeta = {
            id,
            title,
            fileName: entry.name,
            fileType: ext.replace('.', ''),
            category: category.replace(/[/\\]/g, ' / '),
            size: fileSize,
            url: `/api/books/${id}/file`,
            file_url: `/api/books/${id}/file`,
            download_url: `/api/books/${id}/download`
          };

          bookCatalogCache.push(bookMeta);
          bookIdToPathMap.set(id, relativePath);
        }
      }
    }
  }

  walk(rootDir);
  logger.info(`Scanned ${bookCatalogCache.length} book(s) from storage root ${rootDir}`);
  return bookCatalogCache;
}

/**
 * Gets all available books from cache (or scans if cache empty).
 */
export function getAllBooks() {
  if (bookCatalogCache.length === 0) {
    scanBookStorage();
  }
  return bookCatalogCache;
}

/**
 * Gets a single book by secure ID from catalog.
 */
export function getBookById(bookId) {
  if (bookCatalogCache.length === 0) {
    scanBookStorage();
  }
  return bookCatalogCache.find(b => b.id === bookId) || null;
}

/**
 * Gets physical file path for a book by secure ID.
 */
export function getBookFilePathById(bookId) {
  if (bookCatalogCache.length === 0) {
    scanBookStorage();
  }

  const relativePath = bookIdToPathMap.get(bookId);
  if (!relativePath) {
    throw new Error('Book ID not found');
  }

  return resolveSafeBookPath(relativePath, getActiveStorageRoot());
}
