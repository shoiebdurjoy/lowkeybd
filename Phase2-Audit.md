# LowKeyBD Phase 2 - Production Readiness Audit

## Executive Summary
This document presents the results of the production readiness audit conducted for the LowKeyBD application. The audit inventories the modules, analyzes schema constraints, reviews deployment configurations, and evaluates the current security posture. It details the risks across security, reliability, performance, operations, testing, and UX.

---

## 1. Architectural and Module Boundary Inventory

### Backend Modules
- **Identity (`IdentityModule`)**: Manages authentication, user registration, JWT generation, and email verification.
- **Profiles (`ProfileModule`)**: Manages user profiles, update details, and reputation calculations.
- **Communities (`CommunityModule`)**: Manages community creation, settings, and membership joins/leaves.
- **Content (`ContentModule`)**: Manages creation, soft deletions, and retrieval of posts and comments.
- **Voting (`VotingModule`)**: Manages upvotes/downvotes on posts and comments, triggering reputation updates.
- **Reputation (`ReputationModule`)**: Handles calculations of user reputation scores based on votes and contributions.
- **Search (`SearchModule`)**: Integrates Meilisearch to index posts and communities and provide suggestions.
- **Notifications (`NotificationsModule`)**: Distributes real-time events to users over WebSockets.
- **Admin (`AdminModule`)**: Handles administrative logs, statistics, user bans, and feature flags.

### Frontend Routes
- `/` (Home/Global Feed)
- `/login` / `/register` / `/verify` (Authentication & Onboarding)
- `/[username]` (Profile Details)
- `/profile/edit` (Profile Customization)
- `/c/[slug]` (Community details & Feed)
- `/communities` / `/communities/create` (Browse & Create Communities)
- `/posts/[id]` (Post Detail & Comments)
- `/posts/create` (Create Post)
- `/search` (Search Results)
- `/notifications` (User Notifications)
- `/admin` / `/admin/users` / `/admin/reports` / `/admin/audit-logs` / `/admin/feature-flags` (Admin Dashboard)

---

## 2. Infrastructure Inventory
- **PostgreSQL**: Relational database storing core entities (Users, Posts, Comments, Communities, Moderation Actions, Audit Logs).
- **Redis**: In-memory cache used for token rotation tracking, rate limits, and caching.
- **Meilisearch**: Full-text search engine indexer.
- **MinIO**: S3-compatible object storage (stubbed/ready for file attachments).
- **Mailpit**: SMTP server mockup for testing email verification flows.
- **WebSockets**: Socket.io gateway for real-time notifications.

---

## 3. Risk Assessment Matrix

### Issue 1: Committed Plaintext Secrets in Codebase
- **Severity**: Critical
- **Description**: The JWT secret is currently read from environment configurations but falls back to a hardcoded plaintext secret `"super-secret-key-for-dev"` in committed files if not set.
- **Why it matters**: If this fallback is utilized in staging or production, anyone can forge administrative tokens and gain full access to the system.
- **Recommended Milestone**: Milestone 1 (Security Hardening)
- **Suggested Fix**: Enforce strict checks that throw an error at startup if `process.env.JWT_SECRET` is missing in production environments. Move all secrets out of code.

### Issue 2: No Rate Limiting on Sensitive Write Operations & Login Endpoints
- **Severity**: Critical
- **Description**: Endpoints for login (`/api/v1/auth/login`), registration (`/api/v1/auth/register`), voting, posting, and commenting have no active rate limits.
- **Why it matters**: Allows brute-force password guessing, database spamming, and API denial of service.
- **Recommended Milestone**: Milestone 1 (Security Hardening)
- **Suggested Fix**: Register the global `ThrottlerGuard` and apply specific `@Throttle` limit overrides on auth, write, and search endpoints.

### Issue 3: Public Access to Meilisearch Reindexing Endpoint
- **Severity**: High
- **Description**: The endpoint `POST /api/v1/search/reindex` lacks any authentication or role-based check, carrying only `@Public()`.
- **Why it matters**: Anyone can trigger database-wide reindexing loops, creating substantial server overhead, database lockups, and Denial of Service.
- **Recommended Milestone**: Milestone 1 (Security Hardening)
- **Suggested Fix**: Secure the endpoint by removing `@Public()` and applying `RolesGuard` and `@Roles('ADMIN')`.

### Issue 4: WebSocket Authentication Ban Bypass
- **Severity**: High
- **Description**: `NotificationsGateway` validates the cryptographical integrity of the JWT during connection handshake but never checks the database to verify if the user has been banned.
- **Why it matters**: Banned users can maintain persistent WebSocket connections and continue receiving system notifications in real-time.
- **Recommended Milestone**: Milestone 1 (Security Hardening)
- **Suggested Fix**: Perform a database lookup inside `handleConnection` of `NotificationsGateway` and disconnect banned users immediately.

### Issue 5: Unbounded List Queries in Feeds and Admin Pages
- **Severity**: High
- **Description**: Database query paths (such as retrieving community posts, global feeds, audit logs, and reports) do not implement pagination. They fetch all records using `findMany` without boundaries.
- **Why it matters**: As the database grows, loading home feeds or audit logs will exhaust memory, trigger Out Of Memory (OOM) backend crashes, and increase database CPU load.
- **Recommended Milestone**: Milestone 2 (Database Integrity and Optimization)
- **Suggested Fix**: Implement cursor-based pagination on all list controllers and services, and update the Next.js frontend to request paginated data.

### Issue 6: Public Exposure of Internal Service Ports in Docker
- **Severity**: Medium
- **Description**: `docker-compose.yml` maps internal service ports (PostgreSQL `5433`, Redis `6379`, Meilisearch `7700`) directly to host interfaces (equivalent to `0.0.0.0:5433`).
- **Why it matters**: Allows attackers on the same network to scan and target the database or caching layers directly.
- **Recommended Milestone**: Milestone 1 (Security Hardening)
- **Suggested Fix**: Bind all internal service ports strictly to the `127.0.0.1` loopback interface in `docker-compose.yml`.

### Issue 7: Missing Database Composite Indexes
- **Severity**: Medium
- **Description**: Indexes are missing on key sorting and filtering combinations (e.g., querying posts filtered by community slug and sorted by creation date).
- **Why it matters**: Forces sequential scans on large tables, causing latency to degrade exponentially as content scales.
- **Recommended Milestone**: Milestone 2 (Database Optimization)
- **Suggested Fix**: Review query execution plans and add composite indexes in `schema.prisma`.

### Issue 8: Inconsistent API Response Envelopes and Stack Trace Leaks
- **Severity**: Medium
- **Description**: Errors thrown by Prisma/PostgreSQL can leak database schema details, table names, and column details directly to users in API responses.
- **Why it matters**: Information disclosure allows attackers to understand the internal structure of the database.
- **Recommended Milestone**: Milestone 3 (API Consistency)
- **Suggested Fix**: Register a global Exception Filter to intercept Prisma database errors and map them to clean, uniform HTTP error structures.

---

## 4. Test Verification Status
- **Unit Tests**: ✅ 43/43 passed.
- **E2E Tests**: ✅ 1/1 passed.
- **Type Checking**: ✅ `npm run check-types` compiled successfully.
- **Lint Check**: ✅ `npm run lint` succeeded (0 issues).
- **Build Check**: ✅ `npm run build` compiled NestJS and Next.js targets successfully.
