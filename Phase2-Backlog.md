# LowKeyBD Phase 2 - Production Readiness Backlog

This document organizes the Phase 2 roadmap tasks into prioritized items based on business risk, security threats, and launch readiness impact.

---

## Milestone 1: Security Hardening (Highest Priority)
*Objective: Protect user accounts, content, files, privileged operations, and platform reputation before public beta.*

### Task 1.1: Global Security Headers (Helmet)
- **Description**: Add standard HTTP security headers (CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy) using global middleware.
- **Owner**: Backend Lead
- **Dependencies**: None
- **Acceptance Criteria**: Verify security response headers exist in production mode on all API responses.

### Task 1.2: API Rate Limiting (Throttling)
- **Description**: Implement default and custom rate limits on endpoints including login, register, password reset, post creation, comment creation, voting, and search.
- **Owner**: Backend Lead
- **Dependencies**: Redis cluster availability
- **Acceptance Criteria**: Rapid request spikes result in a `429 Too Many Requests` status code.

### Task 1.3: Secure WebSocket Authorization
- **Description**: Harden WebSocket gateway checks by verifying user active ban/restriction statuses during the handshake.
- **Owner**: Backend Lead / Real-time Dev
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Banned users attempting WebSocket connections are instantly disconnected.

### Task 1.4: Restrict Docker Port Exposure
- **Description**: Bind all database, cache, and search port maps in `docker-compose.yml` to the `127.0.0.1` loopback address to prevent public networking interface exposure.
- **Owner**: DevOps Engineer
- **Dependencies**: None
- **Acceptance Criteria**: Scanning host network interfaces shows service ports closed from the outside.

---

## Milestone 2: Database Integrity and Optimization
*Objective: Make PostgreSQL reliable, correct, and performant under high load.*

### Task 2.1: Cursor-Based Pagination
- **Description**: Replace all unbounded database query list endpoints (feeds, comments list, audit logs, reports) with cursor-based pagination.
- **Owner**: Database Engineer
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Feed list API returns paginated cursors and accepts cursor queries.

### Task 2.2: Add Database Indexes
- **Description**: Analyze EXPLAIN query plans on core paths and add composite indexes for sorting and filtering combinations.
- **Owner**: Database Engineer
- **Dependencies**: None
- **Acceptance Criteria**: Verify sequential scans are replaced by index scans on heavy queries.

### Task 2.3: Transaction Safety
- **Description**: Audit reputation updates, voting increments, and comment counts to ensure changes execute in atomic database transactions.
- **Owner**: Database Engineer
- **Dependencies**: None
- **Acceptance Criteria**: Database rollbacks succeed if middle writes fail in a multi-write block.

---

## Milestone 3: API Consistency and Contract Hardening
*Objective: Standardize response formats, intercept SQL stack traces, and unify interface clients.*

### Task 3.1: Global Exception Filter
- **Description**: Intercept and translate database driver/Prisma exceptions into clean, uniform HTTP error structures.
- **Owner**: Backend Dev
- **Dependencies**: None
- **Acceptance Criteria**: Database constraint violations return structured JSON errors instead of internal SQL logs.

### Task 3.2: Centralized API Client
- **Description**: Standardize frontend fetch routines into a single typed client handling token rotation, base URLs, and error parsing.
- **Owner**: Frontend Lead
- **Dependencies**: None
- **Acceptance Criteria**: Eliminate duplicate/ad-hoc fetch templates in frontend pages.

---

## Milestone 4: Reliability and Error Recovery
*Objective: Keep the system stable during partial service degradation (e.g. Mailpit, Redis, or Meilisearch down).*

### Task 4.1: Graceful Service Degradation
- **Description**: Wrap external service calls (such as search indexing or email delivery) in fallback catch blocks to prevent primary workflows from failing when dependencies are offline.
- **Owner**: Backend Lead
- **Dependencies**: None
- **Acceptance Criteria**: Creating a post succeeds even if Meilisearch sync fails.

---

## Milestone 5: Backend & Search Performance
*Objective: Optimize CPU and database pressure on main read paths.*

### Task 5.1: Redis Cache layer
- **Description**: Implement key-based caching with invalidation hooks on posts feed, user profiles, and community details.
- **Owner**: Performance Engineer
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Repeat reads resolve from Redis in under 5ms.
