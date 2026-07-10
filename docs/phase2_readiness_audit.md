# LowKeyBD Phase 2 Readiness Audit Report

This audit documents the current architectural boundaries, database schema issues, validation constraints, security threat models, and frontend state behaviors of the LowKeyBD application, serving as the blueprint for Phase 2 hardening.

---

## 1. Architecture Inventory & Coupling Analysis

### Module Boundaries
The backend consists of the following modular services under `apps/api/src/modules`:
- **Identity**: Manages registration, authentication, email verification, and token lifecycles.
- **Profiles**: Manages user-facing bio, location, and counters.
- **Communities**: Manages hub settings, details, and membership join/leave.
- **Content**: Manages posts, comments, nested replies, and post updates.
- **Voting**: Handles upvote/downvote operations.
- **Reputation**: Computes user contribution/karma scores.
- **Search**: Integrates Meilisearch for indexing posts/hubs and fetching typo-tolerant queries.
- **Notifications**: Delivers real-time WebSocket feeds and emails.
- **Admin**: System overview, user status management, and feature flag toggles.
- **Moderation**: Content reporting, review, and resolution flows.

### Core Flows Mapping
- **Registration & Verification**: Identity Service creates `User` (unverified) -> sends token via Mailer -> `verify-email` verifies DB flag.
- **Post/Comment Creation**: Content Service creates entity -> fires NestJS Event -> Search Service indexes, Notifications Service pushes to relevant users.
- **Voting & Karma**: Voting Service records vote -> updates Post score -> fires reputation event -> Profile Service updates reputation score.

### Cross-Module Coupling & Violations
- **Direct Database Writes**: `ContentService` directly writes to `Post` and `Comment` tables and increments comment/reply counts directly without using a segregated comment submodule layer.
- **Tight Event Coupling**: Events are emitted in-process using `EventEmitter2`. If the event listener fails synchronously, it can affect parent response lifecycles if not wrapped in separate asynchronous error handles.
- **Direct Schema Joins**: Admin, moderation, and profiles query across table boundaries (e.g., profiles joins directly into users) rather than fetching via modular service APIs.

---

## 2. Database Schema (Prisma) Review

### Indexing Analysis
- **Post & Comment**: Soft deletes query `deletedAt: null`. There are indexes on `authorId` and `communityId`, but no index on `deletedAt`, causing full table scans when rendering feeds.
- **UserRestriction**: Looks up `userId` and `isActive` which has an index (`@@index([userId, isActive])`). This is well-optimized.
- **FeatureFlag**: Key has a `@unique` constraint which implicitly adds a unique index.
- **Vote**: Composite uniques on `[userId, postId]` and `[userId, commentId]` ensure database-level voting constraint validation.

### Unbounded Queries & Data Limits
- Feeds (`ContentController.getGlobalFeed`, `CommunitiesController.getPosts`) fetch records using simple `findMany` calls without pagination boundaries (page/limit or cursor bounds).
- **Risk**: As content grows, page loading times will degrade exponentially, overloading server memory and database connections.
- **Resolution**: Enforce cursor-based pagination across all list endpoints in Phase 2 (Milestone 2).

---

## 3. Backend Validation, Auth & Rate Limiting

### Input Validation
- Controller endpoints use NestJS `ValidationPipe` with `{ whitelist: true, transform: true }`.
- DTO files in identity, content, communities, and voting use standard class-validator constraints (`IsString`, `IsOptional`, etc.).
- **Gaps**: Image upload endpoints (for avatar/banner uploads) lack file extension, size, and MIME-type restrictions at the gateway level.

### Authentication & Tokens
- **Refresh Token Rotation**: Refresh tokens are stored as sha256 hashes. Token reuse results in revoking the entire token family, preventing replay attacks.
- **Bans & Restrictions**: Enforced in auth controller, token refresh, and auth guards.

### Rate Limiting
- Auth controllers feature a rate limit of 20 attempts per minute.
- Other write paths (creating posts/comments, voting) still rely on the global 1000 requests/min throttle, which is too permissive.

---

## 4. Frontend UX & Mobile Audit

### State Handling & UI Gaps
- **Loading States**: The feeds and search pages lack skeleton loaders, causing visual layouts to pop when data resolves.
- **Error States**: Network connection failures or API downtime cause silent console logs or basic alert messages rather than user-friendly error banners with retry buttons.
- **Empty States**: Hub searches or profile pages with zero contributions show empty white boxes instead of curated zero-state graphics.
- **Mobile Usability**: Navbar and search layout overlap on narrow viewport widths (e.g., iPhone SE portrait modes).

---

## 5. Security Threat Model

```
+------------+        HTTPS / WSS        +---------+        Prisma TCP        +------------+
|            |  -----------------------> |         |  ---------------------> |            |
|   Client   |                           |  NestJS |                         | PostgreSQL |
|  Browser   |  <----------------------- |   API   |  <--------------------- |  Database  |
|            |      JSON Responses       +---------+      Query Results       +------------+
+------------+                                |
                                              | Local Port 7700
                                              v
                                        +------------+
                                        |            |
                                        |Meilisearch |
                                        +------------+
```

### Trust Boundaries & Attack Vectors
1. **User Input / SQL Injection**: Protected by Prisma's parameterized queries.
2. **XSS (Cross-Site Scripting)**: User-generated content is sanitized. Next.js natively escapes content in React renders.
3. **Session Hijacking**: Access tokens are stored in memory or local state; refresh tokens are stored in localStorage.
   - *Improvement*: Document migrating tokens to HTTP-only cookies in production.
4. **Internal Port Exposure**: Docker-compose services (Redis, database, Meilisearch) bind to external ports (`5433`, `6379`, `7700`). In production, these should be bound only to internal Docker network names to prevent direct public access.

---

## 6. Phase 2 Prioritized Backlog

Mapped to milestones in the blueprint:
- **Milestone 1: Security Hardening** (Rate limiting expansion, upload MIME type constraints, cookie/CSRF plans).
- **Milestone 2: Database Optimization** (Cursor pagination on feeds, composite indexes, transaction wraps).
- **Milestone 3: API Consistency** (Standard response envelopes, OpenAPI specs, centralized fetch client).
- **Milestone 4: Reliability & Recovery** (Graceful degradation for search/Redis, retry queues).
- **Milestone 5: Performance & Caching** (Redis caching for hot routes, Meilisearch settings tune).
- **Milestone 6: Frontend UX Polish** (UI primitives, skeletons, error boundaries, Axe tests).
- **Milestone 7: Observability** (Pino structured logs, health endpoints, dashboards).
- **Milestone 8: CI/CD & Deploy Infrastructure** (Production multi-stage Dockerfiles, backups).
- **Milestone 9: Automated Testing** (Integration tests, Playwright coverage).
- **Milestone 10: Code Quality** (Controller refactoring, dead code cleanup).
- **Milestone 11: Launch Readiness** (Final checklists, beta dry-run).
