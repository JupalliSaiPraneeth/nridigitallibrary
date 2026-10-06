# Load Balancing & Failover Testing Guide

## 1. Verifying Multi-Instance Load Balancing

To verify that NGINX distributes traffic between `api-1` and `api-2`:

```bash
# Execute 10 consecutive requests to health endpoint
for i in {1..10}; do curl -s https://api.library.college.edu/api/health | grep "server"; done
```

**Expected Output:**
```json
"server":"api-1"
"server":"api-2"
"server":"api-1"
"server":"api-2"
...
```

---

## 2. Testing High Availability & Automatic Failover

1. **Start both API instances:**
   ```bash
   pm2 status
   ```

2. **Simulate Instance 1 Crash:**
   ```bash
   pm2 stop library-api-1
   ```

3. **Send Requests:**
   ```bash
   curl -i https://api.library.college.edu/api/health
   ```
   **Expected Result:** HTTP 200 OK returned with `"server":"api-2"`. The user experiences zero downtime or HTTP 503 errors.

4. **Restore Instance 1:**
   ```bash
   pm2 start library-api-1
   ```
   NGINX automatically reinstates `api-1` into the load balancing pool within 30 seconds.

---

## 3. Path Traversal Security Audit Commands

Verify that traversal attacks are safely blocked:

```bash
# Test 1: Directory Traversal
curl -i "https://api.library.college.edu/api/books/../../../../etc/passwd"
# Expected Result: HTTP 403 / 404

# Test 2: Encoded Traversal
curl -i "https://api.library.college.edu/api/books/%2e%2e%2f%2e%2e%2f"
# Expected Result: HTTP 403
```
