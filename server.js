import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();

const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const LAPTOP_IP = '192.168.56.1';

// Exact Windows directory for local books
const BOOKS_DIR = path.resolve('C:\\Users\\jupal\\Downloads\\books');

// Ensure directory exists safely
if (!fs.existsSync(BOOKS_DIR)) {
  fs.mkdirSync(BOOKS_DIR, { recursive: true });
}

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Expose book files directly through /books
app.use('/books', express.static(BOOKS_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (filePath.endsWith('.epub')) {
      res.setHeader('Content-Type', 'application/epub+zip');
    }
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'digital-library-local-server'
  });
});

// Books catalog API endpoint
app.get('/api/books', (req, res) => {
  try {
    if (!fs.existsSync(BOOKS_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(BOOKS_DIR);
    const validExtensions = ['.pdf', '.epub'];

    const books = [];
    let idCounter = 1;

    // Use LAPTOP_IP or incoming host
    const hostHeader = req.get('host');
    const baseUrl = hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1')
      ? `${req.protocol}://${hostHeader}`
      : `http://${LAPTOP_IP}:${PORT}`;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!validExtensions.includes(ext)) continue;

      // Generate title by removing the file extension
      const title = path.basename(file, ext).trim();
      const fileType = ext.replace('.', '');
      const encodedFileName = encodeURIComponent(file);
      const url = `${baseUrl}/books/${encodedFileName}`;

      books.push({
        id: idCounter++,
        title: title,
        fileName: file,
        fileType: fileType,
        url: url
      });
    }

    res.json(books);
  } catch (error) {
    console.error('Error scanning books folder:', error);
    res.status(500).json({ error: 'Failed to scan books directory' });
  }
});

// Start listening on 0.0.0.0:5001
app.listen(PORT, HOST, () => {
  console.log('='.repeat(65));
  console.log(' [Digital Library - Local Laptop Book Server]');
  console.log('='.repeat(65));
  console.log(` Host:       ${HOST}`);
  console.log(` Port:       ${PORT}`);
  console.log(` Network:    http://${LAPTOP_IP}:${PORT}`);
  console.log(` Local:      http://localhost:${PORT}`);
  console.log(` Health:     http://${LAPTOP_IP}:${PORT}/api/health`);
  console.log(` Books API:  http://${LAPTOP_IP}:${PORT}/api/books`);
  console.log(` Books Dir:  ${BOOKS_DIR}`);
  console.log('='.repeat(65));
});
