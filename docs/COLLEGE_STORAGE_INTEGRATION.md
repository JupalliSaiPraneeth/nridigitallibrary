# Digital Library — College Server Book Storage Integration Guide

This guide documents the complete end-to-end integration connecting the **Vercel Frontend** to the **College Server (75GB+ physical book collection)** via a secure HTTP/HTTPS API gateway with NGINX and Cloudflare Tunnel.

---

## 1. Complete Architecture Diagram

```text
                                   INTERNET
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   Vercel Edge Network    │
                        │  Digital Library Frontend │
                        │  (https://*.vercel.app)  │
                        └─────────────┬────────────┘
                                      │
                         HTTPS Request│ (No private IPs exposed)
                                      ▼
                        ┌──────────────────────────┐
                        │   Cloudflare Edge CDN    │
                        │  (WAF, DDoS, SSL Strict) │
                        │  api.library.college.edu │
                        └─────────────┬────────────┘
                                      │
                                      │ Encrypted Outbound Tunnel
                                      │ (Zero Inbound Ports Open)
                                      ▼
                        ┌──────────────────────────┐
                        │    Cloudflare Tunnel     │
                        │    (cloudflared daemon)  │
                        └─────────────┬────────────┘
                                      │
                                      │ Localhost HTTP
                                      ▼
                        ┌──────────────────────────┐
                        │       NGINX Proxy        │
                        │  (proxy_buffering: off;   │
                        │   HTTP Range / RFC 7233) │
                        └─────────────┬────────────┘
                                      │
                                      │ Localhost :5000
                                      ▼
                        ┌──────────────────────────┐
                        │   Library Express API    │
                        │  • Rate Limiting         │
                        │  • Path Traversal Guard  │
                        │  • Partial Stream (206)  │
                        │  • Streamed Download     │
                        └─────────────┬────────────┘
                                      │
                                      │ ID-to-Physical Resolution
                                      ▼
                        ┌──────────────────────────┐
                        │  College Server Storage  │
                        │  (75GB+ Book Collection) │
                        │   e.g. C:\e book         │
                        │   D:\CollegeLibrary\Books│
                        └──────────────────────────┘
```

---

## 2. End-to-End "Read Book" Flow

Here is exactly what happens from the moment a user clicks **Read Book**:

```text
1. User clicks "Read Book" on Vercel:
   └─ Browser dispatches an iframe/fetch request to:
      https://api.library.college.edu/api/books/1024/file

2. Request hits Cloudflare Edge:
   └─ Cloudflare checks SSL certificate, executes WAF inspection & rate limits.
   └─ Routes through the persistent, outbound-encrypted Cloudflare Tunnel.

3. Packet enters College Server via cloudflared:
   └─ Tunnel forwards request to local reverse proxy: http://localhost:80 or http://localhost:5000.
   └─ College router firewall DOES NOT open ports 80/443/445/139.

4. NGINX Reverse Proxy executes:
   └─ proxy_buffering off; ensures memory buffers are bypassed.
   └─ Preserves HTTP Range request headers: Range: bytes=0-1048575.

5. Express Library API Gateway receives request:
   └─ ID Lookup: Resolves ID 1024 -> Physical path: C:\e book\computer-science\operating-systems.pdf.
   └─ Security Guard (isPathSafe): Verifies the path is strictly within BOOK_STORAGE_PATH.
   └─ Range Parser: Detects byte range requested by PDF viewer.
   └─ HTTP 206 Partial Content emitted with Content-Range: bytes 0-1048575/54300000.
   └─ fs.createReadStream(filePath, { start, end }) streams the exact chunk directly.

6. User's Browser receives stream:
   └─ PDF reader renders Page 1 instantly without waiting to download the remaining 50MB+.
   └─ As the user scrolls to Chapter 5, the browser issues further byte-range requests.
```

---

## 3. Environment Variable Configuration

### Root `.env` (College Server Backend & Local Testing)
```env
# Frontend API URL target (Public Cloudflare Tunnel domain in production)
VITE_LIBRARY_API_URL=https://api.library.college.edu

# Physical Book Storage Folder on College Server (75GB+)
# Windows: C:\e book or D:\CollegeLibrary\Books
# Linux:   /var/library/books
BOOK_STORAGE_PATH=C:\e book

# Network & Server Settings
PORT=5000
HOST=0.0.0.0
COLLEGE_SERVER_IP=172.11.1.71

# CORS Allowed Origins (Comma-separated for Vercel and local development)
ALLOWED_ORIGIN=https://*.vercel.app,http://localhost:3000,http://localhost:5000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=500
NODE_ENV=production
```

### Vercel Project Dashboard (Production Frontend)
In your Vercel Dashboard -> **Project Settings** -> **Environment Variables**:
- **Key:** `VITE_LIBRARY_API_URL`
- **Value:** `https://api.library.college.edu` (or your Cloudflare Tunnel public HTTPS URL)
- **Environments:** Production, Preview, Development

---

## 4. API Endpoints Reference

| Method | Endpoint | Description | Headers / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` or `/api/health` | Service health & storage verification | Returns `{ status: "ok", storage: { status: "available", total_books: 142 } }` |
| `GET` | `/api/books` | Full book catalog metadata | Returns JSON list of book objects with IDs, titles, departments, and secure streaming URLs |
| `GET` | `/api/books/search?q=...` | Search books by keyword | Filters catalog across title, department, author, and filename |
| `GET` | `/api/books/:id` | Single book metadata | Detailed metadata, chapter structures, and page counts |
| `GET` | `/api/books/:id/file` | Stream PDF / EPUB with Range Seeking | Returns `HTTP 206` (Partial Content) or `200`, `Accept-Ranges: bytes`, `Content-Range: bytes start-end/total` |
| `GET` | `/api/books/:id/download` | Stream attachment download | Returns `HTTP 200`, `Content-Disposition: attachment; filename="..."`, streams without loading into RAM |

---

## 5. Security & Protection Measures

1. **Strict Path Traversal Protection:**
   The `isPathSafe()` routine verifies every resolved file path:
   ```javascript
   function isPathSafe(targetPath, baseDir) {
     const resolvedTarget = path.resolve(targetPath);
     const resolvedBase = path.resolve(baseDir);
     return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
   }
   ```
   Attacks using `../../Windows/System32`, `\\server\share`, or absolute paths are rejected with `403 Forbidden`.

2. **No Arbitrary Path Queries:**
   Clients can only request books by numerical ID (`/api/books/1024/file`). Arbitrary path parameters such as `/files?path=...` are completely prohibited.

3. **RAM Protection for 75GB+ PDFs:**
   Files are piped using Node.js read streams (`fs.createReadStream()`) and chunked generator streams in FastAPI. No entire book file is ever buffered into server RAM.

4. **Rate Limiting:**
   Each client IP is limited to 500 requests per minute by default, blocking automated scraping.

5. **SMB/Windows Sharing Kept Private:**
   Windows File Sharing ports (139, 445) remain strictly local. Zero inbound ports are opened on the router.

---

## 6. Cloudflare Tunnel Setup Guide

### Windows Server Setup:
1. Download Cloudflare Tunnel daemon for Windows:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Log in to Cloudflare:
   ```powershell
   cloudflared tunnel login
   ```
3. Create the college library tunnel:
   ```powershell
   cloudflared tunnel create library-api
   ```
4. Copy `cloudflared/config.yml` to `C:\Users\Administrator\.cloudflared\config.yml`.
5. Route the public DNS hostname:
   ```powershell
   cloudflared tunnel route dns library-api api.library.college.edu
   ```
6. Install and start as a Windows background service:
   ```powershell
   cloudflared service install
   Start-Service cloudflared
   ```

---

## 7. Linux (Ubuntu Server) Setup Guide

1. Install `cloudflared`:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```
2. Copy configuration:
   ```bash
   sudo mkdir -p /etc/cloudflared
   sudo cp cloudflared/config.yml /etc/cloudflared/config.yml
   ```
3. Install systemd service:
   ```bash
   sudo cloudflared service install
   sudo systemctl enable --now cloudflared
   ```
4. Start Library API as systemd service:
   ```ini
   # /etc/systemd/system/digital-library.service
   [Unit]
   Description=Digital Library College API Gateway
   After=network.target

   [Service]
   Type=simple
   User=library
   WorkingDirectory=/var/library/nridigitallibrary
   ExecStart=/usr/bin/node server.js
   Restart=always
   Environment=NODE_ENV=production
   Environment=PORT=5000
   Environment=BOOK_STORAGE_PATH=/var/library/books

   [Install]
   WantedBy=multi-user.target
   ```

---

## 8. Verification & External Testing Commands

Test in order from local to external:

### A. Local College Server:
```bash
# Test health check
curl http://localhost:5000/api/health

# Test books catalog
curl http://localhost:5000/api/books

# Test byte range seeking (first 1KB of book 1)
curl -I -H "Range: bytes=0-1023" http://localhost:5000/api/books/1/file
```

### B. Through Cloudflare Tunnel:
```bash
# Health check via public HTTPS domain
curl -I https://api.library.college.edu/api/health

# Verify Range header support
curl -I -H "Range: bytes=0-1023" https://api.library.college.edu/api/books/1/file
```

### C. External Mobile 4G/5G Test:
1. Disconnect mobile device from college Wi-Fi.
2. Enable Mobile Data (4G/5G).
3. Open your Vercel deployment URL: `https://YOUR-VERCEL-DOMAIN.vercel.app`.
4. Click **Read Interactive E-Book** and **Download PDF**.
5. Verify seamless PDF rendering and download.
