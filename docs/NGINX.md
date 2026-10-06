# NGINX & Cloudflare Load Balancing Guide

## Load Balancer Algorithm
The configuration uses NGINX's `least_conn` load-balancing directive:
```nginx
upstream library_api {
    least_conn;
    server 192.168.X.10:5000 max_fails=3 fail_timeout=30s;
    server 192.168.X.11:5000 max_fails=3 fail_timeout=30s;
}
```
* **`least_conn`:** Routes new incoming requests to the API server with the fewest active connections. This is optimal for PDF streaming workloads where connections stay open during file reading.
* **`max_fails=3 fail_timeout=30s`:** Automatically marks an API instance as offline for 30 seconds if 3 consecutive requests fail.

---

## Streaming Optimization for PDF Seeking
```nginx
proxy_buffering off;
proxy_set_header Range $http_range;
proxy_set_header If-Range $http_if_range;
```
* `proxy_buffering off;` streams chunks directly from Express to the client browser without filling NGINX memory buffers.
* Passes HTTP Range Request headers so PDF readers can perform byte-range requests (jumping directly to Page 150 without downloading Pages 1–149).

---

## Cloudflare DNS & Proxy Settings
1. **A Record:** Point `api.library.college.edu` to your NGINX Load Balancer Public IP.
2. **SSL Mode:** Set to **Full (Strict)**.
3. **Web Application Firewall (WAF):**
   * Enable OWASP Core Ruleset.
   * Configure Rate Limiting: 500 requests per minute per IP for `/api/books/*`.
