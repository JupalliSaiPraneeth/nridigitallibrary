# System Architecture & Topology

## Overview
The Digital Library System is designed for High Availability (HA), Security, and Scalability. It decouples the public-facing Web Frontend from internal storage servers through a multi-tier architecture.

```text
                         INTERNET
                            │
                            ▼
                  ┌───────────────────┐
                  │     CLOUDFLARE    │
                  │ DNS + WAF + SSL   │
                  └─────────┬─────────┘
                            │
                         HTTPS :443
                            │
                            ▼
                  ┌───────────────────┐
                  │       NGINX       │
                  │  Reverse Proxy +  │
                  │  Load Balancer    │
                  └─────────┬─────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
          ┌─────────────────┐ ┌─────────────────┐
          │   API SERVER 1  │ │   API SERVER 2  │
          │ Node.js/Express │ │ Node.js/Express │
          │  (SERVER_ID=1)  │ │  (SERVER_ID=2)  │
          └────────┬────────┘ └────────┬────────┘
                   │                   │
                   └─────────┬─────────┘
                             ▼
                  ┌─────────────────────┐
                  │   SHARED STORAGE    │
                  │  (NFS / SMB / NAS)  │
                  │ PDF / EPUB / Books  │
                  └─────────────────────┘
```

## Core Layers

### 1. Ingress & Cloudflare WAF Layer
* **Domain:** `https://api.library.college.edu` (API) & `https://library.college.edu` (Frontend).
* **Security:** Cloudflare WAF filters malicious payloads, rate-limits brute force attempts, and provides DDoS mitigation.

### 2. Reverse Proxy & NGINX Load Balancer Layer
* **Role:** TLS Termination, SSL Offloading, Security Headers, Least-Connection Load Balancing across API instances.
* **Buffering Control:** `proxy_buffering off;` enables HTTP Range Request streaming for seamless page-seeking within multi-megabyte PDF e-books without buffering into RAM.

### 3. API Node.js/Express Application Cluster
* **Nodes:** API Server 1 (`192.168.X.X:5000`) & API Server 2 (`192.168.X.X:5000`).
* **Security:** Strict Path Traversal Guards (`safePathResolver`), CORS Origin Filtering (`FRONTEND_URL`), Express Rate Limiting, Helmet Headers.

### 4. Shared Storage Layer
* Both API Server 1 and API Server 2 mount the same physical storage folder (`BOOK_STORAGE_PATH`, e.g., `C:\e book` or `/mnt/shared/books`).
* Guarantees consistent book catalogs across all load-balanced requests.
