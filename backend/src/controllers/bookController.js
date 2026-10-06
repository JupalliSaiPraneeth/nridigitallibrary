import fs from 'fs';
import path from 'path';
import { getAllBooks, getBookFilePathById, scanBookStorage } from '../services/bookService.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Returns catalog of available books.
 */
export function getBooksList(req, res) {
  try {
    const books = getAllBooks();
    res.status(200).json({
      success: true,
      count: books.length,
      books: books
    });
  } catch (error) {
    logger.error('Failed to retrieve books list', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch book catalog'
    });
  }
}

/**
 * Streams book file by secure ID (supports HTTP Range Requests).
 */
export function streamBookFile(req, res) {
  const { id } = req.params;

  try {
    const filePath = getBookFilePathById(id);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();

    const contentType = ext === '.pdf' ? 'application/pdf' : 'application/epub+zip';

    logger.info(`Streaming book ID ${id} (${path.basename(filePath)}) on server ${config.serverId}`);

    // Check for HTTP Range Header (for PDF seeking)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'X-Server-ID': config.serverId
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Accept-Ranges': 'bytes',
        'X-Server-ID': config.serverId
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    logger.warn(`Book stream error for ID ${id}: ${error.message}`);
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: 'Book file not found' });
    }
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error while streaming file' });
  }
}

/**
 * Admin utility to trigger catalog re-scan.
 */
export function rescanStorage(req, res) {
  try {
    const books = scanBookStorage();
    res.status(200).json({
      success: true,
      message: 'Storage rescanned successfully',
      count: books.length
    });
  } catch (error) {
    logger.error('Failed to rescan storage', error);
    res.status(500).json({ success: false, error: 'Storage rescan failed' });
  }
}
