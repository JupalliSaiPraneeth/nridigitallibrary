import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  serverId: process.env.SERVER_ID || 'api-1',
  bookStoragePath: process.env.BOOK_STORAGE_PATH || 'C:\\e book',
  frontendUrl: process.env.FRONTEND_URL || '*',
  allowedExtensions: ['.pdf', '.epub']
};
