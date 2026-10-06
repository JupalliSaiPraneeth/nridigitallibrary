import express from 'express';
import { getBooksList, streamBookFile, rescanStorage } from '../controllers/bookController.js';
import { bookStreamLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/books', getBooksList);
router.get('/books/:id', bookStreamLimiter, streamBookFile);
router.post('/admin/rescan', rescanStorage);

export default router;
