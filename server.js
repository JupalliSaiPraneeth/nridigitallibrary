import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_COLLEGE_IP = '172.11.1.71';

// Detect active local IPv4 addresses (Wi-Fi, Ethernet, LAN)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }
  return addresses;
}

// Configurable College Server Book Folder Path
function resolveBookFolder() {
  const candidateFolders = [
    process.env.COLLEGE_BOOK_FOLDER_PATH,
    process.env.BOOKS_DIR,
    'C:\\e book',
    'C:\\Users\\jupal\\Downloads\\books',
    path.resolve('storage'),
    path.resolve('books')
  ].filter(Boolean);

  for (const folder of candidateFolders) {
    if (fs.existsSync(folder)) {
      try {
        const files = fs.readdirSync(folder);
        if (files.some(f => ['.pdf', '.epub'].includes(path.extname(f).toLowerCase()))) {
          return path.resolve(folder);
        }
      } catch (e) {}
    }
  }
  const fallback = path.resolve('C:\\e book');
  if (!fs.existsSync(fallback)) {
    try { fs.mkdirSync(fallback, { recursive: true }); } catch (e) {}
  }
  return fallback;
}

const BOOKS_DIR = resolveBookFolder();

// Enable CORS for frontend communication (configurable via env for production)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Expose book files directly through /books
app.use('/books', (req, res, next) => {
  const currentBooksDir = resolveBookFolder();
  express.static(currentBooksDir, {
    setHeaders: (resHeader, filePath) => {
      resHeader.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('.pdf')) {
        resHeader.setHeader('Content-Type', 'application/pdf');
        resHeader.setHeader('Content-Disposition', 'inline');
      } else if (filePath.endsWith('.epub')) {
        resHeader.setHeader('Content-Type', 'application/epub+zip');
      }
    }
  })(req, res, next);
});

// Expose static frontend files from project root so devices on LAN/web can open the full web portal
app.use(express.static(path.resolve('.')));

// Health check endpoint for monitoring & status verification
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'digital-library-server'
  });
});

// Favicon fallback
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.resolve('nrilogo.png');
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    res.status(404).send('Favicon not found');
  }
});

// Books catalog API endpoint - Scans college book directory
app.get('/api/books', (req, res) => {
  try {
    const activeDir = resolveBookFolder();
    if (!fs.existsSync(activeDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(activeDir);
    const validExtensions = ['.pdf', '.epub'];

    const books = [];
    let idCounter = 1;

    const hostHeader = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const baseUrl = hostHeader
      ? `${protocol}://${hostHeader}`
      : `http://${DEFAULT_COLLEGE_IP}:${PORT}`;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!validExtensions.includes(ext)) continue;

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
    console.error('Error scanning college book folder:', error);
    res.status(500).json({ error: 'Failed to scan college book directory' });
  }
});

// Single book details API endpoint
app.get('/api/books/:id', (req, res) => {
  try {
    const activeDir = resolveBookFolder();
    const bookId = parseInt(req.params.id, 10);
    if (!fs.existsSync(activeDir)) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const files = fs.readdirSync(activeDir);
    const validExtensions = ['.pdf', '.epub'];
    let idCounter = 1;

    const hostHeader = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const baseUrl = hostHeader
      ? `${protocol}://${hostHeader}`
      : `http://${DEFAULT_COLLEGE_IP}:${PORT}`;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!validExtensions.includes(ext)) continue;

      if (idCounter === bookId) {
        const title = path.basename(file, ext).trim();
        const fileType = ext.replace('.', '');
        const encodedFileName = encodeURIComponent(file);
        const url = `${baseUrl}/books/${encodedFileName}`;

        return res.json({
          id: idCounter,
          title: title,
          fileName: file,
          fileType: fileType,
          url: url,
          pdf_path: url,
          cover_url: '',
          total_pages: 100,
          chapters: []
        });
      }
      idCounter++;
    }

    return res.status(404).json({ error: 'Book not found' });
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Failed to fetch book details' });
  }
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

// Start listening with EADDRINUSE fallback to 5001 if 5000 is occupied
function startCollegeServer(portToUse) {
  const server = app.listen(portToUse, HOST, () => {
    const ips = getLocalIpAddresses();
    const wifiIface = ips.find(i => i.name.toLowerCase().includes('wi-fi') || i.name.toLowerCase().includes('wireless')) || ips[0];

    console.log('='.repeat(65));
    console.log(' [Digital Library - College Book Server API]');
    console.log('='.repeat(65));
    console.log(` Active Host/Port:   http://localhost:${portToUse}`);
    console.log(` College Server IP: http://${DEFAULT_COLLEGE_IP}:${portToUse}`);
    console.log(` Book Directory:    ${resolveBookFolder()}`);
    console.log(` Health Endpoint:   http://localhost:${portToUse}/api/health`);
    console.log(` Books API:         http://localhost:${portToUse}/api/books`);
    console.log('='.repeat(65));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && portToUse === 5000) {
      console.warn(`[College Server] Port 5000 is occupied (e.g. by PostgreSQL). Retrying on port 5001...`);
      startCollegeServer(5001);
    } else {
      console.error('[College Server] Failed to start server:', err);
    }
  });
}

startCollegeServer(PORT);
