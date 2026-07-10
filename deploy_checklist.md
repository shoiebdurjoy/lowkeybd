# LowKeyBD Staging & Production Deployment Checklist

This document guides the staging and production deployment of the LowKeyBD application.

---

## 1. Pre-Deployment Verification

Before triggering any deployment, ensure that all local code checks pass cleanly:

- [ ] **Lint Verification**: `npm run lint` must exit with `0` (no warnings/errors).
- [ ] **TypeScript Check**: `npm run check-types` must exit with `0` (no type errors).
- [ ] **Production Build**: `npm run build` must compile both NestJS API and Next.js Frontend.
- [ ] **Migrations Synced**: `npx prisma db push --force-reset` or migrations are applied cleanly.

---

## 2. Infrastructure Setup & Environment Variables

Make sure the target environment (Staging or Production) has the following variables configured:

### NestJS Backend (`api` service)
```env
PORT=3001
NODE_ENV=production

# Database Connection
DATABASE_URL="postgresql://<user>:<password>@<db-host>:5432/lowkeybd?sslmode=require&schema=public"

# Redis Cache & Queue
REDIS_URL="redis://<redis-host>:6379"

# Search Engine
MEILI_HTTP_ADDR="http://<meilisearch-host>:7700"
MEILI_MASTER_KEY="<secure-master-key>"

# Authentication Secrets
JWT_SECRET="<secure-random-jwt-secret>"
JWT_REFRESH_SECRET="<secure-random-refresh-secret>"

# Mail Server
MAIL_HOST="<smtp-host>"
MAIL_PORT=587
MAIL_USER="<smtp-user>"
MAIL_PASSWORD="<smtp-password>"
MAIL_FROM="noreply@lowkeybd.com"
```

### Next.js Frontend (`web` service)
```env
# Next.js Server & API URL
NEXT_PUBLIC_API_URL="https://api.lowkeybd.com"
PORT=3000
```

---

## 3. Database Scaling & Migration Policy

- [ ] **Backup Trigger**: Create a snapshot backup of the current database before running migrations.
- [ ] **Schema Migrations**: Use `npx prisma migrate deploy` in production instead of `db push` to avoid data loss.
- [ ] **Connection Pooling**: Use a database proxy/connection pooler (like PgBouncer) if active API scaling starts.
- [ ] **Indexing Validation**: Confirm indexes are set up on high-traffic fields:
  - `User.email` and `User.username` (unique index)
  - `Post.score`, `Post.createdAt`, `Post.authorId`, `Post.communityId`
  - `Comment.postId`, `Comment.authorId`
  - `Vote.userId`, `Vote.postId`, `Vote.commentId`

---

## 4. Cache and Queue Configuration

- [ ] **Redis Status**: Verify Redis memory limits are set (`maxmemory` policy) to avoid out-of-memory crashes on cache expansions.
- [ ] **Cache TTL**: Confirm API caching is configured (e.g. 5 minutes for search pages, 15 minutes for community directories).
- [ ] **Queue Worker Limits**: Ensure queue background workers for notifications are run under supervisors (like systemd or PM2) to auto-restart on failures.

---

## 5. Security Checklist

- [ ] **Secure Transport**: Ensure all API endpoints and frontend sites are protected with HTTPS (SSL/TLS).
- [ ] **Strict CORS**: Define correct frontend domains in the backend CORS whitelist:
  ```typescript
  // production CORS configuration
  origin: ['https://lowkeybd.com', 'https://www.lowkeybd.com']
  ```
- [ ] **Security Headers**: Enable Helmet.js middleware on the NestJS API.
- [ ] **Cookie Security**: Set JWT cookies to `HttpOnly`, `Secure`, and `SameSite=Strict`.
- [ ] **Rate Limiting**: Enable ThrottlerGuard on all public endpoints:
  - Registration / Login: max 5 requests per minute.
  - Search / Suggestion: max 30 requests per minute.

---

## 6. Search Index Seeding

- [ ] **Meilisearch Initialization**: Ensure search indexes are configured with proper settings (searchable attributes, ranking rules) on initial deployment:
  - Searchable: `title`, `content`, `communityName`, `authorUsername`
  - Typo Tolerance: Enabled
  - Synonyms/Stopwords: Seeding complete
