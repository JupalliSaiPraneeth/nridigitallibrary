# Deployment & Installation Guide

## 1. Prerequisites
* **OS:** Linux (Ubuntu 22.04 LTS recommended) or Windows Server
* **Node.js:** v18.x or v20.x LTS
* **Process Manager:** PM2 (`npm install -g pm2`)
* **Web Server:** NGINX v1.18+

---

## 2. API Server 1 Deployment (`api-1`)

1. **Clone/Copy Project Files:**
   ```bash
   mkdir -p /opt/digital-library-backend
   cp -r backend/* /opt/digital-library-backend/
   cd /opt/digital-library-backend
   ```

2. **Install Production Dependencies:**
   ```bash
   npm install --production
   ```

3. **Configure Environment Variables (`.env`):**
   ```env
   NODE_ENV=production
   PORT=5000
   SERVER_ID=api-1
   BOOK_STORAGE_PATH=/mnt/shared/books
   FRONTEND_URL=https://library.college.edu
   ```

4. **Start Application with PM2:**
   ```bash
   pm2 start src/server.js --name "library-api-1"
   pm2 save
   pm2 startup
   ```

---

## 3. API Server 2 Deployment (`api-2`)

Repeat the steps above on API Server 2 with `.env` configured for `api-2`:
```env
NODE_ENV=production
PORT=5000
SERVER_ID=api-2
BOOK_STORAGE_PATH=/mnt/shared/books
FRONTEND_URL=https://library.college.edu
```

Start PM2:
```bash
pm2 start src/server.js --name "library-api-2"
pm2 save
```

---

## 4. NGINX Load Balancer Setup

1. **Install NGINX:**
   ```bash
   sudo apt update && sudo apt install -y nginx
   ```

2. **Copy Virtual Host Configuration:**
   Copy `nginx/api.library.college.edu.conf` to `/etc/nginx/sites-available/api.library.college.edu.conf`.

3. **Update Upstream IP Placeholders:**
   Edit `/etc/nginx/sites-available/api.library.college.edu.conf` and replace `192.168.X.X` with your actual private IPs of API Server 1 and API Server 2.

4. **Enable Virtual Host & Reload NGINX:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.library.college.edu.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 5. Frontend Environment Configuration

In your Vercel or production web host build environment, set:
```env
VITE_LIBRARY_API_URL=https://api.library.college.edu
```
