# TODO - Fix Next.js static 404s

## Step 1 — Build/runtime verification
- [ ] Inspect `frontend/.next/standalone` expectations vs current repo build artifacts.
- [ ] Verify nginx always proxies to the frontend Next server.

## Step 2 — Implement fail-fast Dockerfile checks
- [ ] Update `frontend/Dockerfile` to assert `server.js` and `.next/static` exist in the standalone output during build.

## Step 3 — (If needed) fix serving/static path
- [ ] Adjust Dockerfile copy paths / runtime file layout so Next standalone serves `/_next/static/*` correctly.

## Step 4 — Nginx hardening
- [ ] Add explicit `location /_next/` proxy block if required.

## Step 5 — Test
- [ ] Rebuild containers and validate with curl: `GET /` and `GET /_next/static/...` return 200.
