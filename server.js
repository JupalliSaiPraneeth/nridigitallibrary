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

// Configurable College Server Book Folder Path (Default: C:\e book)
const CONFIGURED_FOLDER = process.env.COLLEGE_BOOK_FOLDER_PATH || process.env.BOOKS_DIR || 'C:\\e book';
const DEV_FALLBACK_FOLDER = path.resolve('C:\\Users\\jupal\\Downloads\\books');
const BOOKS_DIR = fs.existsSync(CONFIGURED_FOLDER)
  ? CONFIGURED_FOLDER
  : (fs.existsSync(DEV_FALLBACK_FOLDER) ? DEV_FALLBACK_FOLDER : CONFIGURED_FOLDER);

// Ensure directory exists safely
if (!fs.existsSync(BOOKS_DIR)) {
  try {
    fs.mkdirSync(BOOKS_DIR, { recursive: true });
  } catch (e) {
    console.warn(`[College Server] Could not create folder ${BOOKS_DIR}:`, e.message);
  }
}

// Enable CORS for frontend communication (configurable via env for production)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Expose book files directly through /books
app.use('/books', express.static(BOOKS_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    } else if (filePath.endsWith('.epub')) {
      res.setHeader('Content-Type', 'application/epub+zip');
    }
  }
}));

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
    if (!fs.existsSync(BOOKS_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(BOOKS_DIR);
    const validExtensions = ['.pdf', '.epub'];

    const books = [];
    let idCounter = 1;

    // Use incoming host or fallback to College Server IP
    const hostHeader = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const baseUrl = hostHeader
      ? `${protocol}://${hostHeader}`
      : `http://${DEFAULT_COLLEGE_IP}:${PORT}`;

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
    console.error('Error scanning college book folder:', error);
    res.status(500).json({ error: 'Failed to scan college book directory' });
  }
});

// Single book details API endpoint
app.get('/api/books/:id', (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (!fs.existsSync(BOOKS_DIR)) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const files = fs.readdirSync(BOOKS_DIR);
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

// Start listening on 0.0.0.0:5000 (or PORT env)
app.listen(PORT, HOST, () => {
  const ips = getLocalIpAddresses();
  const wifiIface = ips.find(i => i.name.toLowerCase().includes('wi-fi') || i.name.toLowerCase().includes('wireless')) || ips[0];

  console.log('='.repeat(65));
  console.log(' [Digital Library - College Book Server API]');
  console.log('='.repeat(65));
  console.log(` College Server IP: http://${DEFAULT_COLLEGE_IP}:${PORT}`);
  console.log(` Bound Host:        ${HOST}:${PORT}`);
  console.log(` Book Directory:    ${BOOKS_DIR}`);
  console.log(` Health Endpoint:   http://${DEFAULT_COLLEGE_IP}:${PORT}/api/health`);
  console.log(` Books API:         http://${DEFAULT_COLLEGE_IP}:${PORT}/api/books`);
  console.log('='.repeat(65));
});
