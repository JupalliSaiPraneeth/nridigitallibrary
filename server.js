import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();

const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = process.env.HOST || '0.0.0.0';

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

// Expose static frontend files from project root so mobile devices on Wi-Fi can open the full web app
app.use(express.static(path.resolve('.')));

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

    // Use incoming host or fallback
    const hostHeader = req.get('host');
    const baseUrl = hostHeader
      ? `${req.protocol}://${hostHeader}`
      : `http://localhost:${PORT}`;

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

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

// Start listening on 0.0.0.0:5001
app.listen(PORT, HOST, () => {
  const ips = getLocalIpAddresses();
  const wifiIface = ips.find(i => i.name.toLowerCase().includes('wi-fi') || i.name.toLowerCase().includes('wireless')) || ips[0];
  const primaryIp = wifiIface ? wifiIface.address : '127.0.0.1';

  console.log('='.repeat(65));
  console.log(' [Digital Library - Local Laptop Book Server]');
  console.log('='.repeat(65));
  console.log(` Host:              ${HOST}`);
  console.log(` Port:              ${PORT}`);
  console.log(` Local Laptop:      http://localhost:${PORT}`);
  if (wifiIface) {
    console.log(` Phone (Same Wi-Fi): http://${primaryIp}:${PORT}`);
  }
  for (const item of ips) {
    console.log(`   * ${item.name}: http://${item.address}:${PORT}`);
  }
  console.log(` Health:            http://localhost:${PORT}/api/health`);
  console.log(` Books API:         http://localhost:${PORT}/api/books`);
  console.log(` Books Dir:         ${BOOKS_DIR}`);
  console.log('='.repeat(65));
});
