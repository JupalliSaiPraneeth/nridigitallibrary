import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ============================================================================
// 1. ENVIRONMENT CONFIGURATION LOADING
// ============================================================================
function loadEnvironmentVariables() {
  // Built-in Node.js .env loader (Node 20.6+)
  try {
    if (typeof process.loadEnvFile === 'function') {
      const envPath = path.resolve('.env');
      if (fs.existsSync(envPath)) {
        process.loadEnvFile(envPath);
      }
    }
  } catch (e) {
    // Fallback simple line-by-line .env parser
    try {
      const envPath = path.resolve('.env');
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch (err) {}
  }
}

loadEnvironmentVariables();

const app = express();

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_COLLEGE_IP = process.env.COLLEGE_SERVER_IP || '172.11.1.71';
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '500', 10);

// ============================================================================
// 2. NETWORK & STORAGE RESOLUTION
// ============================================================================

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

// Configurable College Server Physical Book Folder Path (75GB+)
function resolveBookFolder() {
  const candidateFolders = [
    process.env.BOOK_STORAGE_PATH,
    process.env.COLLEGE_BOOK_FOLDER_PATH,
    process.env.BOOKS_DIR,
    'C:\\e book',
    'D:\\CollegeLibrary\\Books',
    'C:\\Users\\jupal\\Downloads\\books',
    path.resolve('storage'),
    path.resolve('books')
  ].filter(Boolean);

  for (const folder of candidateFolders) {
    const resolved = path.resolve(folder);
    if (fs.existsSync(resolved)) {
      try {
        const stats = fs.statSync(resolved);
        if (stats.isDirectory()) {
          return resolved;
        }
      } catch (e) {}
    }
  }

  // Fallback creation for development
  const fallback = path.resolve(process.env.BOOK_STORAGE_PATH || 'C:\\e book');
  if (!fs.existsSync(fallback)) {
    try { fs.mkdirSync(fallback, { recursive: true }); } catch (e) {}
  }
  return fallback;
}

const BOOKS_DIR = resolveBookFolder();

// ============================================================================
// 3. SECURITY GUARDS & PATH TRAVERSAL DEFENSE
// ============================================================================

/**
 * Validates that a requested physical path is strictly contained inside the allowed base folder.
 * Prevents directory traversal attacks like ../../Windows or /etc/passwd.
 */
function isPathSafe(targetPath, baseDir) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(baseDir);
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

/**
 * Sanitizes filename for HTTP Content-Disposition headers.
 */
function sanitizeFilename(filename) {
  return filename.replace(/["\r\n\/\\]/g, '_');
}

// ============================================================================
// 4. RATE LIMITING & AUDIT LOGGING
// ============================================================================
const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute window

function rateLimiter(req, res, next) {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let clientRecord = rateLimitMap.get(ip);
  if (!clientRecord || (now - clientRecord.startTime) > RATE_WINDOW_MS) {
    clientRecord = { count: 1, startTime: now };
    rateLimitMap.set(ip, clientRecord);
  } else {
    clientRecord.count++;
  }

  // Periodic cleanup
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now - v.startTime > RATE_WINDOW_MS) rateLimitMap.delete(k);
    }
  }

  if (clientRecord.count > RATE_LIMIT_PER_MINUTE) {
    console.warn(`[RATE LIMIT EXCEEDED] IP: ${ip} attempted ${clientRecord.count} requests in 1m`);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment before downloading or making more requests.'
    });
  }

  next();
}

// Access audit logging
app.use((req, res, next) => {
  const start = Date.now();
  const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-';
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api') || req.path.startsWith('/books')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - IP: ${clientIp}`);
    }
  });
  next();
});

// ============================================================================
// 5. CORS CONFIGURATION
// ============================================================================
const rawAllowed = process.env.ALLOWED_ORIGIN || process.env.FRONTEND_URL || '*';
const allowedOrigins = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow origin: reflect requested origin or allow all for student / cross-device access
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, If-Range, X-Requested-With, Access-Control-Request-Private-Network');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Disposition');
  // W3C Private Network Access (PNA) header - allows HTTPS (Vercel) to call private network IP on Chrome/MacBook
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.removeHeader('X-Frame-Options');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// ============================================================================
// 6. BOOK CATALOG SCANNER & IN-MEMORY INDEX
// ============================================================================
const VALID_EXTENSIONS = ['.pdf', '.epub'];

const DEPT_KEYWORDS = {
  'CSE': ['computer', 'software', 'programming', 'python', 'java', 'algorithm', 'data structure', 'network', 'ai', 'logic', 'compiler', 'operating system', 'database', 'cyber'],
  'ECE': ['electronic', 'communication', 'vlsi', 'circuit', 'analog', 'signal', 'microcontroller', 'embedded', 'dsp', 'semiconductor', 'antenna'],
  'EEE': ['electrical', 'power', 'machine', 'energy', 'high voltage', 'control system', 'circuit theory'],
  'MECH': ['mechanical', 'thermodynamic', 'fluid', 'machinery', 'automobile', 'cad', 'manufacturing', 'robotics', 'kinematics'],
  'CIVIL': ['civil', 'structure', 'concrete', 'surveying', 'geotechnical', 'hydrology', 'construction', 'bridge'],
  'PHARM': ['pharmacy', 'chemistry', 'drug', 'pharmacology', 'medicinal', 'biology']
};

function inferDepartment(title, filePath) {
  const combined = `${title} ${filePath}`.toLowerCase();
  for (const [dept, keywords] of Object.entries(DEPT_KEYWORDS)) {
    if (keywords.some(k => combined.includes(k))) {
      return dept;
    }
  }
  return 'CSE';
}

/**
 * Recursively scans directory for PDF and EPUB files up to maxDepth.
 */
function scanBooksRecursively(dir, maxDepth = 4, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return results;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanBooksRecursively(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (VALID_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning folder ${dir}:`, err.message);
  }
  return results;
}

/**
 * Builds controlled in-memory book catalog.
 */
function getBookCatalog() {
  const activeDir = resolveBookFolder();
  const filePaths = scanBooksRecursively(activeDir);

  const books = [];
  let idCounter = 1;

  for (const filePath of filePaths) {
    try {
      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);
      const rawTitle = path.basename(filePath, ext).replace(/[-_]/g, ' ').trim();
      const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      const relativePath = path.relative(activeDir, filePath).replace(/\\/g, '/');
      const dept = inferDepartment(title, relativePath);

      books.push({
        id: idCounter++,
        title: title,
        fileName: fileName,
        relativePath: relativePath,
        filePath: filePath,
        fileSize: stat.size,
        fileType: ext.replace('.', ''),
        dept: dept,
        category: `${dept} Curriculum`,
        author: 'Faculty Scholars & Subject Matter Experts',
        authors: ['Faculty Scholars & Subject Matter Experts'],
        publisher: 'NRI Institute of Technology Academic Press',
        year: 2026,
        createdAt: stat.birthtime || stat.mtime
      });
    } catch (e) {}
  }

  return books;
}

// Resolve base URL for client responses
function getBaseUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost || req.get('host');
  const protocol = forwardedProto || req.protocol || 'http';

  if (host) {
    return `${protocol}://${host}`;
  }
  return `http://${DEFAULT_COLLEGE_IP}:${PORT}`;
}

// ============================================================================
// 7. API ENDPOINTS
// ============================================================================

// Health check endpoint for monitoring & Cloudflare / NGINX status verification
app.get(['/health', '/api/health'], (req, res) => {
  const activeDir = resolveBookFolder();
  const isStorageAccessible = fs.existsSync(activeDir);
  let bookCount = 0;

  if (isStorageAccessible) {
    try {
      const catalog = getBookCatalog();
      bookCount = catalog.length;
    } catch (e) {}
  }

  res.json({
    status: 'ok',
    service: 'digital-library-server',
    storage: {
      status: isStorageAccessible ? 'available' : 'unavailable',
      configured_path: activeDir,
      total_books: bookCount
    },
    timestamp: new Date().toISOString()
  });
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.resolve('nrilogo.png');
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    res.status(404).send('Favicon not found');
  }
});

// Books catalog API endpoint - Scans college book directory
app.get('/api/books', rateLimiter, (req, res) => {
  try {
    const catalog = getBookCatalog();
    const baseUrl = getBaseUrl(req);

    const formattedBooks = catalog.map(b => {
      const fileEndpoint = `${baseUrl}/api/books/${b.id}/file`;
      const downloadEndpoint = `${baseUrl}/api/books/${b.id}/download`;

      return {
        id: b.id,
        title: b.title,
        fileName: b.fileName,
        fileSize: b.fileSize,
        fileType: b.fileType,
        dept: b.dept,
        category: b.category,
        author: b.author,
        authors: b.authors,
        publisher: b.publisher,
        year: b.year,
        total_pages: Math.min(1000, Math.max(50, Math.round(b.fileSize / (1024 * 70)))),
        url: fileEndpoint,
        file_url: fileEndpoint,
        download_url: downloadEndpoint,
        pdf_path: fileEndpoint,
        pdfUrl: fileEndpoint,
        cover_url: '',
        chapters: []
      };
    });

    res.json(formattedBooks);
  } catch (error) {
    console.error('Error scanning college book folder:', error);
    res.status(500).json({ error: 'Failed to scan college book directory' });
  }
});

// Search books endpoint
app.get('/api/books/search', rateLimiter, (req, res) => {
  try {
    const q = (req.query.q || req.query.query || '').trim().toLowerCase();
    if (!q) {
      return res.redirect('/api/books');
    }

    const catalog = getBookCatalog();
    const baseUrl = getBaseUrl(req);

    const filtered = catalog.filter(b => {
      return (
        b.title.toLowerCase().includes(q) ||
        b.dept.toLowerCase().includes(q) ||
        b.fileName.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
      );
    });

    const result = filtered.map(b => {
      const fileEndpoint = `${baseUrl}/api/books/${b.id}/file`;
      const downloadEndpoint = `${baseUrl}/api/books/${b.id}/download`;

      return {
        id: b.id,
        title: b.title,
        fileName: b.fileName,
        fileSize: b.fileSize,
        fileType: b.fileType,
        dept: b.dept,
        category: b.category,
        author: b.author,
        url: fileEndpoint,
        file_url: fileEndpoint,
        download_url: downloadEndpoint,
        pdf_path: fileEndpoint,
        pdfUrl: fileEndpoint
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ error: 'Search operation failed' });
  }
});

// Single book metadata API endpoint
app.get('/api/books/:id', rateLimiter, (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const catalog = getBookCatalog();
    const book = catalog.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const baseUrl = getBaseUrl(req);
    const fileEndpoint = `${baseUrl}/api/books/${book.id}/file`;
    const downloadEndpoint = `${baseUrl}/api/books/${book.id}/download`;

    res.json({
      id: book.id,
      title: book.title,
      fileName: book.fileName,
      fileSize: book.fileSize,
      fileType: book.fileType,
      dept: book.dept,
      category: book.category,
      author: book.author,
      authors: book.authors,
      publisher: book.publisher,
      year: book.year,
      total_pages: Math.min(1000, Math.max(50, Math.round(book.fileSize / (1024 * 70)))),
      url: fileEndpoint,
      file_url: fileEndpoint,
      download_url: downloadEndpoint,
      pdf_path: fileEndpoint,
      pdfUrl: fileEndpoint,
      cover_url: '',
      chapters: []
    });
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Failed to fetch book details' });
  }
});

// ============================================================================
// 8. SECURE LARGE PDF STREAMING (HTTP RANGE REQUESTS / RFC 7233)
// ============================================================================
app.get('/api/books/:id/file', rateLimiter, (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const catalog = getBookCatalog();
    const book = catalog.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Security path verification
    if (!isPathSafe(book.filePath, BOOKS_DIR)) {
      console.warn(`[SECURITY ALERT] Unauthorized path access attempted for book ${bookId}`);
      return res.status(403).json({ error: 'Access denied: Path traversal detected' });
    }

    if (!fs.existsSync(book.filePath)) {
      return res.status(404).json({ error: 'Physical book file missing from college server storage' });
    }

    const stat = fs.statSync(book.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const mimeType = book.fileType === 'epub' ? 'application/epub+zip' : 'application/pdf';
    const safeFilename = sanitizeFilename(book.fileName);

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (range) {
      // Parse Range Header e.g. "bytes=0-1048575"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize || end >= fileSize) {
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).json({ error: 'Requested range not satisfiable' });
      }

      const chunkSize = (end - start) + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);

      const stream = fs.createReadStream(book.filePath, { start, end });
      stream.on('error', (err) => {
        console.error(`Stream error on book ${bookId}:`, err);
        if (!res.headersSent) res.status(500).end();
      });
      stream.pipe(res);
    } else {
      // Entire file streaming (efficient read stream, no RAM buffering)
      res.status(200);
      res.setHeader('Content-Length', fileSize);

      const stream = fs.createReadStream(book.filePath);
      stream.on('error', (err) => {
        console.error(`Stream error on book ${bookId}:`, err);
        if (!res.headersSent) res.status(500).end();
      });
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error streaming book file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream book file from college server' });
    }
  }
});

// ============================================================================
// 9. SECURE STREAMED FILE DOWNLOAD
// ============================================================================
app.get('/api/books/:id/download', rateLimiter, (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const catalog = getBookCatalog();
    const book = catalog.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (!isPathSafe(book.filePath, BOOKS_DIR)) {
      console.warn(`[SECURITY ALERT] Unauthorized path access attempted for download on book ${bookId}`);
      return res.status(403).json({ error: 'Access denied: Path traversal detected' });
    }

    if (!fs.existsSync(book.filePath)) {
      return res.status(404).json({ error: 'Physical book file missing from college server storage' });
    }

    const stat = fs.statSync(book.filePath);
    const fileSize = stat.size;
    const mimeType = book.fileType === 'epub' ? 'application/epub+zip' : 'application/pdf';
    const safeFilename = sanitizeFilename(book.fileName);

    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-';
    console.log(`[DOWNLOAD EVENT] Book ID ${bookId} (${book.title}) requested for download by IP: ${clientIp}`);

    res.status(200);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = fs.createReadStream(book.filePath);
    stream.on('error', (err) => {
      console.error(`Download stream error on book ${bookId}:`, err);
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading book file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download book from college server' });
    }
  }
});

// ============================================================================
// 10. BACKWARDS COMPATIBILITY STATIC ROUTE (PROTECTED)
// ============================================================================
app.use('/books', (req, res, next) => {
  const currentBooksDir = resolveBookFolder();
  // Decode filename and verify security path
  const reqFile = decodeURIComponent(req.path.replace(/^\//, ''));
  const targetPath = path.join(currentBooksDir, reqFile);

  if (!isPathSafe(targetPath, currentBooksDir)) {
    return res.status(403).json({ error: 'Access denied: Path traversal detected' });
  }

  express.static(currentBooksDir, {
    setHeaders: (resHeader, filePath) => {
      resHeader.setHeader('Access-Control-Allow-Origin', '*');
      resHeader.setHeader('Access-Control-Allow-Private-Network', 'true');
      resHeader.setHeader('Accept-Ranges', 'bytes');
      if (filePath.endsWith('.pdf')) {
        resHeader.setHeader('Content-Type', 'application/pdf');
        resHeader.setHeader('Content-Disposition', 'inline');
      } else if (filePath.endsWith('.epub')) {
        resHeader.setHeader('Content-Type', 'application/epub+zip');
      }
    }
  })(req, res, next);
});

// Expose static frontend files when hosted together
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(path.resolve('.')));

// Serve index.html for SPA navigation fallback (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/books')) {
    return next();
  }
  const distIndex = path.resolve('dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  const rootIndex = path.resolve('index.html');
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  next();
});

// ============================================================================
// 11. SERVER LAUNCHER
// ============================================================================
function startCollegeServer(portToUse) {
  const server = app.listen(portToUse, HOST, () => {
    const ips = getLocalIpAddresses();
    const activeIps = ips.map(i => `${i.name}: ${i.address}`).join(' | ');

    console.log('='.repeat(70));
    console.log(' [NRI Digital Library - College Server Book Storage API Gateway]');
    console.log('='.repeat(70));
    console.log(` Active Host/Port:     http://localhost:${portToUse}`);
    console.log(` College Server IP:   http://${DEFAULT_COLLEGE_IP}:${portToUse}`);
    if (activeIps) {
      console.log(` Local Network IPs:   ${activeIps}`);
    }
    console.log(` Book Storage Folder: ${resolveBookFolder()}`);
    console.log(` Health Endpoint:     http://localhost:${portToUse}/api/health`);
    console.log(` Books API:           http://localhost:${portToUse}/api/books`);
    console.log(` CORS Allowed:        ${rawAllowed}`);
    console.log('='.repeat(70));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && portToUse < 5010) {
      const nextPort = portToUse + 1;
      console.warn(`[College Server] Port ${portToUse} is occupied. Trying next port ${nextPort}...`);
      startCollegeServer(nextPort);
    } else {
      console.error('[College Server] Failed to start server:', err);
    }
  });
}

startCollegeServer(PORT);
