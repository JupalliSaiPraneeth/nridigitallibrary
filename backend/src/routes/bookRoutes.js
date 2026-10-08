import express from 'express';
import {
  getBooksList,
  getBookDetails,
  streamBookFile,
  downloadBookFile,
  rescanStorage
} from '../controllers/bookController.js';
import { bookStreamLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Catalog list
router.get('/books', getBooksList);

// Specific file endpoints
router.get('/books/:id/file', bookStreamLimiter, streamBookFile);
router.get('/books/:id/stream', bookStreamLimiter, streamBookFile);
router.get('/books/:id/download', bookStreamLimiter, downloadBookFile);

// ID Endpoint: Returns metadata if JSON is accepted and not a range/direct view, otherwise streams
router.get('/books/:id', (req, res) => {
  const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
  if (acceptsJson && !req.headers.range) {
    return getBookDetails(req, res);
  }
  return bookStreamLimiter(req, res, () => streamBookFile(req, res));
});

// Admin Operations
router.post('/admin/rescan', rescanStorage);

export default router;
