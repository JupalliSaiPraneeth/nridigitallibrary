import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Resolves and validates a file path securely within BOOK_STORAGE_PATH.
 * Prevents Directory Traversal (../, ..\, encoded traversal, symlink escapes).
 */
export function resolveSafeBookPath(relativePath, customStorageRoot) {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('Invalid file path specified');
  }

  // Reject null bytes and encoded traversal tokens
  if (relativePath.includes('\0') || relativePath.includes('%2e%2e') || relativePath.includes('%2E%2E')) {
    logger.warn('Path traversal attempt detected with null bytes or encoded tokens', { relativePath });
    throw new Error('Access denied: Illegal characters in path');
  }

  // Resolve absolute path against root storage directory
  const rootDir = customStorageRoot || path.resolve(config.bookStoragePath);
  const resolvedPath = path.resolve(rootDir, relativePath);

  // Enforce boundary check: Resolved path MUST start with storage root directory
  if (!resolvedPath.startsWith(rootDir)) {
    logger.warn('Path traversal attempt blocked', { relativePath, resolvedPath, rootDir });
    throw new Error('Access denied: Requested path outside storage root');
  }

  // Check physical existence
  if (!fs.existsSync(resolvedPath)) {
    throw new Error('Requested file not found');
  }

  // Verify realpath (resolves symlinks) to ensure symlink escape prevention
  const realPath = fs.realpathSync(resolvedPath);
  if (!realPath.startsWith(rootDir)) {
    logger.warn('Symlink path traversal attempt blocked', { relativePath, realPath, rootDir });
    throw new Error('Access denied: Symlink target outside storage root');
  }

  // Validate allowed extensions
  const ext = path.extname(realPath).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    logger.warn('Attempt to access forbidden file type', { realPath, ext });
    throw new Error('Access denied: Unsupported file extension');
  }

  return realPath;
}
