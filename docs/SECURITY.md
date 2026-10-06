# Security Architecture & Safeguards

## 1. Directory Traversal Mitigation (`safePathResolver.js`)
All book file accesses pass through `resolveSafeBookPath(relativePath)`:
* **Null Byte Guard:** Rejects `\0`.
* **Encoded Traversal Guard:** Rejects `%2e%2e` and `%2E%2E`.
* **Root Boundary Enforcer:** `path.resolve(rootDir, relativePath)` must start with `path.resolve(rootDir)`.
* **Symlink Target Escape Guard:** Resolves realpaths via `fs.realpathSync` to guarantee symlink targets do not point outside `BOOK_STORAGE_PATH`.

---

## 2. CORS Policy
In production (`NODE_ENV=production`), CORS restricts origin to `FRONTEND_URL`:
```javascript
// Allowed Origin: https://library.college.edu
```
Requests from unauthorized domains are rejected at the HTTP preflight level.

---

## 3. Security Headers (Helmet)
* `Strict-Transport-Security` (HSTS): Enforces HTTPS for 1 year (`31536000` seconds).
* `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing attacks.
* `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking.
* `Referrer-Policy: strict-origin-when-cross-origin`

---

## 4. Rate Limiting
* General API: 300 requests / 15 min.
* Book Streaming: 500 requests / 15 min.
