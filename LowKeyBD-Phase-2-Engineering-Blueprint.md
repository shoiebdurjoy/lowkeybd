# LowKeyBD Phase 2 Engineering Blueprint

Production-readiness roadmap for transforming the working MVP into a secure, reliable, observable, scalable application.

**Project:** LowKeyBD

**Phase:** Phase 2 - Production Readiness

**Scope:** Hardening, performance, reliability, infrastructure, UX polish, testing, and launch readiness

**Out of Scope:** Major new product features

## Phase 2 Mission

- Do not add major product features in Phase 2.
- Transform the completed MVP into a secure, reliable, observable, scalable, production-ready application.
- Prioritize the highest business risk first: security, database integrity, reliability, deployment safety, performance, UX polish, test coverage, and launch readiness.
- Assume the application may soon support thousands of real users and must be operated with professional production discipline.

## Recommended Execution Order

| Order | Milestone | Primary Reason |
|---:|---|---|
| 0 | Production Readiness Audit | Establish current-state evidence. |
| 1 | Security Hardening | Reduce highest business and user risk first. |
| 2 | Database Integrity and Optimization | Protect core data correctness and query scalability. |
| 3 | API Consistency and Contract Hardening | Make API behavior stable for frontend and tests. |
| 4 | Reliability and Error Recovery | Ensure partial failures do not break core journeys. |
| 5 | Backend, Search, and Cache Performance | Improve speed and reduce system pressure. |
| 6 | Frontend Performance and UX Polish | Make the product feel polished and accessible. |
| 7 | Observability, Logging, and Monitoring | Make production behavior visible. |
| 8 | CI/CD and Production Infrastructure | Make deploys repeatable and reversible. |
| 9 | Automated Testing Expansion | Prevent regressions. |
| 10 | Code Quality and Architecture Cleanup | Reduce technical debt safely. |
| 11 | Launch Readiness | Prepare for controlled beta launch. |

## Milestone 0: Production Readiness Audit

### Purpose

Establish the true current state before changing the system. Phase 2 should begin with evidence, not assumptions.

### Objectives

- Inventory backend modules, frontend routes, database models, infrastructure services, tests, and deployment scripts.
- Identify Critical, High, Medium, and Low risks across security, reliability, performance, UX, testing, and operations.
- Create a tracked Phase 2 backlog with owners, dependencies, and acceptance criteria.

### Architecture Changes

- Document current module boundaries: identity, profiles, communities, content, voting, reputation, search, notifications, admin, and platform.
- Map core flows: register, verify email, login, create community, create post, comment, vote, search, notify, moderate.
- Identify cross-module coupling and any direct database writes that violate ownership boundaries.

### Database Changes

- Review every Prisma model and relation against the current MVP behavior.
- List unbounded queries, missing indexes, weak constraints, nullable fields, cascade behavior, and soft-delete inconsistencies.

### Backend Tasks

- Review guards, DTOs, validation pipes, interceptors, filters, WebSocket gateways, queues, and scheduled jobs.
- Identify endpoints without validation, authorization, rate limiting, consistent responses, or audit logging.

### Frontend Tasks

- Review all routes for loading, error, empty, unauthorized, mobile, keyboard, and screen reader states.
- Catalog duplicated API calls, duplicated styles, inconsistent forms, and rough navigation moments.

### Infrastructure Tasks

- Review Docker Compose, Dockerfiles, environment variables, CI/CD, logging, health checks, and backup assumptions.
- Confirm which services are required in dev, staging, and production.

### Security Tasks

- Build a threat model for browser-to-API, API-to-database, API-to-Redis, API-to-Meilisearch, uploads-to-MinIO, email, and WebSockets.
- Identify trust boundaries, sensitive assets, abuse paths, and privileged operations.

### Performance Tasks

- Capture baseline p50, p95, and p99 latency for home, search, post detail, community feed, notifications, auth, and WebSocket connection.
- Capture frontend baseline: Lighthouse, bundle size, web vitals, and mobile responsiveness.

### UX Improvements

- Create a UX issue list for confusing labels, weak feedback, missing states, mobile overflow, and accessibility gaps.

### Testing Requirements

- Run existing unit, integration, E2E, lint, typecheck, and build commands.
- Record failing, skipped, flaky, or missing tests.

### Acceptance Criteria

- A written audit exists and is stored in the repo documentation.
- Every major risk has severity, owner, dependency, and suggested milestone.
- The Phase 2 backlog is ordered by business risk and launch readiness impact.

### Risks

- Existing tests may pass while critical behavior remains untested.
- Hidden coupling can make later hardening more expensive than expected.

### Dependencies

- Full repo access, working local Docker stack, existing test commands, and current environment documentation.

## Milestone 1: Security Hardening

### Purpose

Protect user accounts, content, files, privileged operations, and platform reputation before real public use.

### Objectives

- Complete an OWASP-style security review.
- Harden authentication, authorization, input handling, file upload, token lifecycle, secrets, and rate limiting.
- Remove Critical and High security risks before further polish work.

### Architecture Changes

- Centralize permission checks through reusable policy helpers or guards.
- Define role and permission ownership for user, moderator, admin, and system operations.
- Standardize security middleware for CORS, headers, request size limits, validation, and request IDs.

### Database Changes

- Verify refresh tokens are stored only as hashes with expiry, revocation, family ID, and created metadata.
- Ensure audit tables exist for auth events, permission changes, moderation actions, and admin actions.
- Add immutable or append-only behavior for security-sensitive logs where practical.

### Backend Tasks

- Audit every endpoint as public, authenticated, moderator-only, admin-only, or system-only.
- Verify users cannot edit others' content, view others' notifications, bypass moderation, self-award reputation, or vote repeatedly.
- Review JWT expiry, refresh rotation, refresh reuse detection, logout invalidation, and token signing configuration.
- Add CSRF protection if cookie-based auth is used; if localStorage is used, document risk and plan migration to httpOnly cookies.
- Validate every request body, query, and route param with DTOs and strict validation pipes.
- Sanitize user-generated text before rendering or indexing.
- Harden WebSocket auth and room subscription authorization.
- Normalize login/register errors where enumeration risk matters.

### Frontend Tasks

- Avoid unsafe HTML rendering and sanitize any markdown/rich content.
- Add session-expiry handling and safe redirects for protected pages.
- Add client-side upload validation for type, size, and dimensions.
- Show clear but safe error messages for forbidden, unauthorized, rate limited, and rejected uploads.

### Infrastructure Tasks

- Move secrets out of committed files and document secret manager usage.
- Add safe .env.example files for web, API, database, Redis, Meilisearch, MinIO, email, JWT, and Socket.io.
- Add production security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.
- Ensure production Docker configuration does not expose internal service ports publicly.

### Security Tasks

- Review OWASP Top 10: access control, crypto failures, injection, insecure design, misconfiguration, vulnerable components, auth failures, integrity failures, logging failures, SSRF.
- Rate limit register, login, refresh, password reset, email verification, posting, commenting, voting, search, report submission, upload, and WebSocket connection attempts.
- Constrain uploads by MIME type, extension, size, image dimensions, storage bucket policy, and future malware scanning interface.

### Performance Tasks

- Ensure security middleware adds acceptable latency.
- Cache permission lookups only when safe and invalidation is clear.

### UX Improvements

- Improve user-facing messages for expired sessions, invalid permissions, rate limits, and upload rejections.
- Do not expose sensitive technical details in UI errors.

### Testing Requirements

- Add tests for unauthorized, forbidden, invalid token, expired token, refresh reuse, role bypass, malformed input, upload rejection, and rate limits.
- Add WebSocket authentication and room authorization tests.

### Acceptance Criteria

- No known Critical or High access-control issue remains.
- Every protected endpoint has verified auth and permission coverage.
- All request boundaries are validated.
- Secrets are not committed.
- Security headers exist in production mode.

### Risks

- Changing auth behavior can break existing sessions.
- Cookie/CSRF migration can require frontend auth refactoring.

### Dependencies

- Milestone 0 audit, current auth behavior, and working automated tests.

## Milestone 2: Database Integrity and Optimization

### Purpose

Make PostgreSQL reliable, efficient, and safe under real user activity.

### Objectives

- Review indexes, constraints, transactions, cascade behavior, connection pooling, and Prisma query patterns.
- Remove unbounded data access from user-facing and admin-facing flows.
- Protect denormalized counters and reputation changes with transactions or reconciliation.

### Architecture Changes

- Formalize database access rules: no unbounded queries, cursor pagination for large lists, transactions for multi-write business operations.
- Keep module-owned writes inside owning services.

### Database Changes

- Review indexes for users, posts, comments, votes, notifications, reports, audit logs, search sync records, and moderation tables.
- Add composite indexes for common filter-plus-sort queries.
- Review unique constraints for email, username, community slug, votes, memberships, notification preferences, and token hashes.
- Review cascade and restrict behavior for users, communities, posts, comments, votes, reports, notifications, and files.
- Define migration naming, review, rollback, and forward-fix policy.

### Backend Tasks

- Replace unbounded findMany calls with cursor pagination.
- Ensure voting, reputation, comment count, notification creation, report resolution, and search indexing updates are transactional where required.
- Add slow query logging in non-production and safe production sampling.
- Reduce Prisma overfetching by using select/include shapes intentionally.

### Frontend Tasks

- Update feeds, comments, notifications, reports, search results, and audit logs to consume cursor pagination.
- Add load more or infinite scrolling where appropriate.

### Infrastructure Tasks

- Define connection pooling through PgBouncer or managed pooling.
- Configure Prisma connection limits for API and worker processes.
- Add backup and restore verification workflow.

### Security Tasks

- Ensure production database is private and accessed with least-privilege credentials.
- Ensure database URLs and migration credentials are secret-managed.

### Performance Tasks

- Run explain plans for global feed, community feed, post detail, comments, notifications, search sync, and admin reports.
- Tune indexes based on actual query plans, not guesswork.

### UX Improvements

- Large feeds, comments, and admin pages should load progressively instead of freezing.

### Testing Requirements

- Add integration tests for pagination, transaction rollback, unique constraints, soft deletes, and counter consistency.
- Add realistic seed data to expose slow queries.

### Acceptance Criteria

- No critical user-facing list query is unbounded.
- Core queries have appropriate indexes.
- Multi-write business operations are transactionally safe.
- Backups are automated and restore-tested.

### Risks

- New constraints may reveal dirty existing data.
- Excess indexes can slow writes.

### Dependencies

- Security audit complete and database access available.

## Milestone 3: API Consistency and Contract Hardening

### Purpose

Make APIs predictable for frontend, future mobile apps, and external integrations.

### Objectives

- Standardize response envelopes, errors, pagination, versioning, request IDs, and OpenAPI documentation.
- Create one frontend API client instead of duplicated fetch logic.

### Architecture Changes

- Add global exception filter, response envelope interceptor, request ID propagation, and shared pagination DTOs.
- Confirm API versioning policy and route conventions.

### Database Changes

- No schema change expected.

### Backend Tasks

- Standardize success responses with data and meta.
- Standardize error responses with code, message, details, and requestId.
- Add OpenAPI/Swagger docs with auth annotations and DTO examples.
- Add pagination metadata to all list endpoints.
- Add cache headers or ETags to public read endpoints where safe.

### Frontend Tasks

- Create centralized API client for base URL, token injection, refresh handling, error parsing, and retries.
- Replace ad hoc fetch calls.
- Add typed response helpers for common API shapes.

### Infrastructure Tasks

- Expose API docs only in safe environments or behind admin auth.
- Ensure request IDs appear in logs and responses.

### Security Tasks

- Ensure docs do not expose secrets or internal-only routes.
- Ensure validation failures do not leak stack traces.

### Performance Tasks

- Avoid oversized response payloads and unnecessary nested includes.

### UX Improvements

- Consistent API errors allow consistent UI feedback and fewer confusing failures.

### Testing Requirements

- Add contract tests for critical endpoints.
- Add snapshot tests for error envelopes.
- Add OpenAPI generation test.
- Add API client tests.

### Acceptance Criteria

- Core APIs follow one response and error shape.
- OpenAPI docs are accurate for current production routes.
- Frontend uses shared API client for new and migrated calls.
- All list endpoints support pagination.

### Risks

- Changing response shapes can break frontend pages.
- OpenAPI can drift if not verified in CI.

### Dependencies

- Security and database milestones mostly complete.

## Milestone 4: Reliability and Error Recovery

### Purpose

Keep LowKeyBD usable when Redis, Meilisearch, email, WebSockets, or background jobs partially fail.

### Objectives

- Add graceful degradation and recovery mechanisms.
- Make background work retryable and observable.
- Prevent temporary failures from corrupting user flows.

### Architecture Changes

- Define queue abstraction, retry policy, dead-letter behavior, and fallback behavior for each external dependency.
- Separate primary user actions from non-critical side effects.

### Database Changes

- Add delivery status fields or job tracking tables only if queue tooling does not provide enough visibility.

### Backend Tasks

- Add retry logic for email delivery, search indexing, notification fanout, and scheduled reconciliation.
- Add replay tooling for failed indexing or notification jobs.
- Ensure email/search/realtime failures do not roll back primary content creation unless business-critical.
- Add graceful fallback if Meilisearch or Redis is down.
- Add centralized error logging and failure classification.

### Frontend Tasks

- Add route-level error boundaries.
- Add retry buttons for failed page loads.
- Add offline or connection-lost indicators.
- Preserve drafts during temporary failures where possible.

### Infrastructure Tasks

- Add liveness and readiness checks for web, API, workers, database, Redis, Meilisearch, MinIO, and email.
- Add graceful shutdown hooks and container restart policies.

### Security Tasks

- Redact tokens, passwords, cookies, verification codes, reset tokens, and private content from error logs.

### Performance Tasks

- Use exponential backoff and jitter to avoid retry storms.
- Add external service timeouts.

### UX Improvements

- Users should see clear retryable failure states instead of blank screens.
- Search can degrade to a simpler result mode when advanced search is unavailable.

### Testing Requirements

- Simulate Redis outage, Meilisearch outage, email failure, WebSocket disconnect, worker crash, and queue retry.
- Verify no duplicate emails or notifications from retries.

### Acceptance Criteria

- Primary app remains usable if search, email, or realtime is temporarily unavailable.
- Failed jobs can be inspected and retried.
- No blank-screen failure states remain in core routes.
- Health endpoints accurately reflect service state.

### Risks

- Retries can create duplicate side effects.
- Fallback behavior can hide real incidents unless logged and alerted.

### Dependencies

- Queue system, logging, and stable API contracts.

## Milestone 5: Backend, Search, and Cache Performance

### Purpose

Improve speed and reduce database pressure for the highest-traffic flows.

### Objectives

- Optimize NestJS, Redis, Meilisearch, pagination, and common read paths.
- Define safe cache ownership and invalidation.

### Architecture Changes

- Define cache keys, TTLs, invalidation triggers, and private versus public cache rules.
- Formalize search indexing pipeline and reindex strategy.

### Database Changes

- Add indexes discovered by load testing and explain plans.
- Add denormalized fields only where justified by measured query cost.

### Backend Tasks

- Cache popular communities, trending posts, user profile summaries, search suggestions, feature flags, and safe public reads.
- Invalidate cache on post, comment, vote, profile, community, moderation, and feature flag changes.
- Batch expensive operations where useful.
- Tune response compression and response payload sizes.

### Frontend Tasks

- Avoid duplicate requests and use client-side stale-while-revalidate patterns.
- Consume paginated and cached endpoints consistently.

### Infrastructure Tasks

- Configure Redis memory limits, eviction policy, and persistence.
- Tune Meilisearch searchable, filterable, sortable attributes, ranking rules, typo tolerance, synonyms, stop words, and snapshots.

### Security Tasks

- Never cache private user data in public keys.
- Avoid caching auth responses.

### Performance Tasks

- Targets: cached API p95 under 300ms, uncached common reads p95 under 700ms, search p95 under 500ms, home usable under 2.5s on mid-range mobile.
- Profile global feed, community feed, post detail, comments, notifications, and search suggestions.

### UX Improvements

- Search suggestions, feed loading, and notification loading should feel instant or near-instant.

### Testing Requirements

- Add performance tests for feed, post detail, search, notifications, and voting bursts.
- Add cache invalidation tests and search relevance tests.

### Acceptance Criteria

- Core read endpoints meet agreed p95 targets under realistic seed load.
- Cache invalidation is tested.
- Meilisearch settings and reindex process are documented.

### Risks

- Bad cache invalidation can show stale or incorrect data.
- Search tuning can harm relevance if changed without test queries.

### Dependencies

- Database optimization and reliability work complete.

## Milestone 6: Frontend Performance and UX Polish

### Purpose

Make LowKeyBD feel fast, clear, accessible, and trustworthy on mobile and desktop.

### Objectives

- Improve mobile responsiveness, loading states, error states, forms, navigation, theme consistency, and accessibility.
- Reduce frontend bundle size and layout shift.

### Architecture Changes

- Standardize UI primitives: Button, Input, Textarea, Select, Dialog, Toast, Skeleton, EmptyState, ErrorState, Pagination, and AppShell.
- Standardize form handling, route protection, and layout patterns.

### Database Changes

- No schema change expected.

### Backend Tasks

- Support frontend UX with efficient metadata and pagination endpoints only where needed.

### Frontend Tasks

- Polish home, search, community detail, post detail, comments, profile, notifications, settings, admin, and moderation routes.
- Add skeletons, empty states, 404, 500, unauthorized, forbidden, and network error pages.
- Add toast notifications and consistent form feedback.
- Improve command palette, keyboard navigation, focus rings, touch targets, and dark mode consistency.
- Lazy-load heavy components and optimize images/fonts.

### Infrastructure Tasks

- Add bundle analyzer and frontend performance budgets.
- Add Lighthouse CI if practical.

### Security Tasks

- Review client token handling and prevent raw internal errors from reaching users.

### Performance Tasks

- Use appropriate Next.js rendering strategies: static where safe, server-rendered where useful, client-only only when necessary.
- Reduce unnecessary client components and code split admin/moderation tools.

### UX Improvements

- Search remains central.
- Posting and commenting provide clear pending, success, and failure states.
- Mobile navigation is obvious and comfortable.
- Animations are subtle and respect reduced motion.

### Testing Requirements

- Add Playwright tests for critical journeys and mobile viewports.
- Add axe accessibility tests and visual regression checks for core pages.

### Acceptance Criteria

- Core pages pass WCAG AA.
- No major mobile layout breakage remains.
- All core forms have loading, success, and error states.
- Bundle size and Lighthouse results are reviewed and documented.

### Risks

- Polish can expand scope if not controlled.
- Animations can harm accessibility or performance.

### Dependencies

- Stable API contracts and shared API client.

## Milestone 7: Observability, Logging, and Monitoring

### Purpose

Make production behavior visible, diagnosable, and alertable.

### Objectives

- Add structured logs, metrics, request IDs, health checks, dashboards, and alerts.
- Ensure security-sensitive logs are redacted.

### Architecture Changes

- Standardize logging format and request correlation.
- Define metric names, event names, and dashboard ownership.

### Database Changes

- Separate audit logs from operational logs.
- Define retention policy for audit and operational data.

### Backend Tasks

- Log auth events, failed logins, moderation actions, search failures, email failures, job failures, rate limit hits, and admin actions.
- Expose metrics for request count, latency, error rate, queue depth, job failures, search latency, DB latency, and WebSocket connections.

### Frontend Tasks

- Add frontend error tracking, web vitals reporting, and privacy-safe analytics events.
- Track search, post creation, comment creation, community join, and report submission without collecting unnecessary personal data.

### Infrastructure Tasks

- Choose logging and metrics stack: managed monitoring or Prometheus/Grafana plus Loki/ELK.
- Add alerts for API down, DB unavailable, Redis unavailable, Meilisearch unavailable, high error rate, high latency, stuck queue, disk usage, and backup failure.

### Security Tasks

- Redact passwords, tokens, cookies, verification tokens, reset tokens, and private content.
- Restrict access to logs and dashboards.

### Performance Tasks

- Ensure logging is non-blocking and noisy logs are sampled where appropriate.

### UX Improvements

- Better monitoring reduces downtime and helps the team fix user-impacting issues quickly.

### Testing Requirements

- Test log redaction, request ID propagation, health endpoints, and representative alert conditions.

### Acceptance Criteria

- Production incidents can be diagnosed from logs and metrics.
- Dashboards exist for core system health.
- Critical alerts are routed to maintainers.
- Sensitive values are redacted.

### Risks

- Excessive logs increase cost.
- Poor redaction can leak sensitive data.

### Dependencies

- Production infrastructure target selected.

## Milestone 8: CI/CD and Production Infrastructure

### Purpose

Make deployments repeatable, safe, observable, and reversible.

### Objectives

- Harden Docker images and deployment workflows.
- Add CI gates, staging deploys, production approval, smoke tests, backups, and rollback plans.

### Architecture Changes

- Separate dev, staging, and production configuration.
- Define topology for web, API, worker, PostgreSQL, Redis, Meilisearch, object storage, and email.
- Split worker process from API when background jobs require independent scaling.

### Database Changes

- Define migration review and release policy.
- Require backup before risky production migrations.
- Document rollback versus forward-fix strategy.

### Backend Tasks

- Add production build validation, worker entrypoint, migration command, graceful shutdown, and startup dependency checks.

### Frontend Tasks

- Validate production public environment variables.
- Ensure the Next.js app builds cleanly in CI and uses safe production config.

### Infrastructure Tasks

- Create multi-stage Dockerfiles using non-root users and minimal final images.
- Add CI: install, lint, typecheck, unit tests, integration tests, build, Prisma migration check, Docker build.
- Add CD: deploy staging, smoke test, manual approval, deploy production, post-deploy smoke test.
- Automate PostgreSQL backups, Meilisearch snapshots, and MinIO backups.
- Document and test rollback.

### Security Tasks

- Use secret manager, TLS, secure CORS, production headers, private internal networking, and dependency audit in CI.

### Performance Tasks

- Set resource limits, compression, CDN strategy, and autoscaling plan if using managed containers.

### UX Improvements

- Safer deploys reduce user disruption and enable faster recovery.

### Testing Requirements

- CI must fail on lint, type, test, build, Docker build, or Prisma schema issues.
- Smoke tests must cover home, login, API health, search, and auth in staging.

### Acceptance Criteria

- A clean commit can deploy to staging automatically.
- Production deployment requires approval.
- Rollback process is documented and tested.
- Backups are automated and restore-tested.

### Risks

- Deployment complexity can slow iteration.
- Migration rollback is harder than app rollback.

### Dependencies

- Observability and environment variable documentation.

## Milestone 9: Automated Testing Expansion

### Purpose

Prevent regressions as LowKeyBD moves from MVP to production.

### Objectives

- Expand unit, integration, E2E, load, security, and accessibility tests.
- Make CI a reliable launch gate.

### Architecture Changes

- Define test pyramid: many unit tests, focused integration tests, critical E2E tests, scheduled load/security tests.
- Add test data builders and isolated test database reset workflow.

### Database Changes

- Add deterministic seed data and migration reset strategy for tests.

### Backend Tasks

- Add unit tests for auth, permissions, voting, reputation, search indexing, notifications, moderation, and rate limits.
- Add integration tests for Prisma transactions, repositories, file uploads, and background jobs.
- Add API E2E for register, verify, login, refresh, create community, create post, comment, vote, search, notification, report, and moderation resolution.

### Frontend Tasks

- Add component tests for forms, navigation, search, post cards, comments, vote controls, notifications, and admin states.
- Add Playwright flows for onboarding, creating content, finding content, mobile navigation, command palette, reporting, and moderation.

### Infrastructure Tasks

- Run tests in CI with reports and critical coverage thresholds.
- Add nightly E2E or scheduled load tests if needed.

### Security Tasks

- Add dependency scanning, basic SAST, auth bypass tests, and malicious input tests.

### Performance Tasks

- Add load, stress, and soak testing for search, feeds, voting bursts, notifications, and WebSocket connections.

### UX Improvements

- Automated accessibility and journey tests prevent user-facing regressions.

### Testing Requirements

- Cover unit, integration, E2E, accessibility, security, load, stress, and smoke tests.

### Acceptance Criteria

- Critical backend logic has meaningful coverage.
- Core user journeys pass in Playwright.
- CI blocks unsafe regressions.
- Accessibility checks run for key pages.
- Load test baseline is documented.

### Risks

- Flaky tests reduce trust.
- Too many broad E2E tests slow development.

### Dependencies

- Stable APIs, stable selectors, and test database.

## Milestone 10: Code Quality and Architecture Cleanup

### Purpose

Reduce technical debt before it becomes expensive.

### Objectives

- Clarify module boundaries, remove duplication, standardize naming, and clean dependencies.
- Refactor only where it improves launch safety or maintainability.

### Architecture Changes

- Review boundaries for identity, profiles, communities, content, voting, reputation, search, notifications, moderation, admin, and platform.
- Introduce abstractions only when repeated patterns justify them.

### Database Changes

- Rename confusing fields before launch if needed.
- Document non-obvious schema choices.
- Remove unused fields only after verification.

### Backend Tasks

- Refactor duplicated user extraction, permission checks, pagination, error handling, and Prisma select/include shapes.
- Keep controllers thin and business logic in services or domain policies.
- Remove dead code and unused routes.

### Frontend Tasks

- Extract repeated UI components, API calls, route guards, layouts, forms, and state handling.
- Remove unused assets and styles.
- Standardize design tokens where practical.

### Infrastructure Tasks

- Clean scripts, package names, workspace config, Docker config, and unused dependencies.

### Security Tasks

- Review dependency vulnerabilities and remove risky unused packages.
- Ensure no debug-only code is enabled in production.

### Performance Tasks

- Remove heavy dependencies where simple alternatives exist.
- Reduce duplicate frontend bundles and unnecessary client components.

### UX Improvements

- Consistent components improve perceived quality and reduce confusing states.

### Testing Requirements

- Add tests before risky refactors and run the full suite after cleanup.

### Acceptance Criteria

- Module boundaries are documented.
- No obvious duplicated core logic remains.
- Unused major dependencies are removed.
- Naming is consistent across API, DB, and frontend.
- Full test suite passes.

### Risks

- Refactoring can introduce regressions.
- Too much cleanup can delay launch.

### Dependencies

- Expanded test coverage from Milestone 9.

## Milestone 11: Launch Readiness

### Purpose

Prepare LowKeyBD for a controlled production beta with clear risk controls.

### Objectives

- Complete final production, deployment, security, backup, rollback, monitoring, UX, and performance checklists.
- Freeze major changes and accept only launch-critical fixes.

### Architecture Changes

- Freeze architecture for launch candidate.
- Document any deferred Phase 2 risks with explicit acceptance by project owner.

### Database Changes

- Run final migration review.
- Verify production backup and restore.
- Confirm safe seed/minimum production data.

### Backend Tasks

- Verify env vars, email, WebSockets, Meilisearch indexing, notification delivery, moderation/admin access, rate limits, logs, and metrics.

### Frontend Tasks

- QA public, authenticated, profile, content, search, notifications, admin, error, and mobile pages.
- QA dark/light mode and browser compatibility.

### Infrastructure Tasks

- Run production deploy dry run.
- Verify DNS, TLS, CDN, object storage, database, Redis, Meilisearch, monitoring, alerting, incident contacts, and rollback drill.

### Security Tasks

- Run final OWASP checklist, dependency audit, secrets audit, CORS/header check, admin account review, and rate-limit verification.

### Performance Tasks

- Run final load test, Lighthouse check, API p95 check, database slow query check, and search latency check.

### UX Improvements

- Fix launch-blocking UX only; avoid redesigns during release candidate stage.

### Testing Requirements

- Run full CI, full E2E, staging smoke test, and production smoke test after deployment.

### Acceptance Criteria

- No unresolved Critical or High production risk remains.
- Backups and rollback are tested.
- Monitoring and alerts are live.
- Core user journeys pass on staging.
- Deployment checklist is complete.

### Risks

- Last-minute changes can destabilize launch.
- Untested rollback can turn a small issue into a major incident.

### Dependencies

- All previous milestones complete or explicitly deferred with owner approval.

## Phase 2 Definition of Done

- The app is secure enough for a controlled public beta.
- No known Critical or High production risks remain unresolved.
- Core APIs are documented, consistent, validated, and versioned.
- Database queries are indexed, paginated, reviewed, and backed by restore-tested backups.
- Docker and deployment workflows are production-grade.
- Logs, metrics, request IDs, health checks, dashboards, and alerts exist.
- Critical user journeys are covered by automated tests.
- Accessibility and mobile usability are verified.
- Load testing has established baseline capacity and bottlenecks.
- Rollback and disaster recovery procedures are documented and tested.

Phase 2 should end with LowKeyBD ready for a controlled production beta, not with additional product surface area.
