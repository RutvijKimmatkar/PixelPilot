---
name: node-express-backend-engineering
description: Plan, design, implement, review, and harden small-to-medium Node.js and Express backends with pragmatic layered architecture, sound API and database design, secure connections, centralized error handling, and SOLID/KISS balance. Use for backend features, refactors, schema/index decisions, integrations, performance work, and debugging.
---

# Node.js + Express Backend Engineering Skill

## Mission

Build backend systems that are **correct, secure, understandable, testable, and appropriately simple** for hackathons, personal projects, internships, prototypes, and small-to-medium applications.

Do not optimize for the largest architecture, the most abstractions, the most files, or the most code. Optimize for the simplest design that meets the actual requirements and can be safely extended.

Use the current project's stack and conventions unless there is a concrete reason to change them. This skill assumes JavaScript, Node.js, and Express, but must adapt to the project's actual database, ORM, authentication provider, hosting platform, and package versions.

## 1. Mandatory workflow

### 1.1 Inspect before changing

Before implementing a non-trivial task:

1. Read the relevant project instructions (`AGENTS.md`, other applicable agent files, and installed skills).
2. Inspect `package.json`, the relevant directory structure, configuration, existing routes/controllers/services/repositories, database schema and migrations, middleware, tests, and error-handling conventions.
3. Trace the current request/data flow and identify what calls what.
4. Identify existing libraries, utilities, services, and platform capabilities that could solve the problem.
5. Determine compatibility constraints and avoid assuming that a library or API works a certain way without checking the project's version or authoritative documentation.

Do not propose a new architecture before understanding the one already present. Do not rewrite unrelated files to satisfy a local task.

### 1.2 Write a concise implementation plan first

**Start every task with a brief plan before changing code.** For a tiny, obvious change, one or two bullets are enough. For a task involving multiple files, architecture, database/schema/indexes, API behavior, authentication, connections, performance, or external integrations, use roughly 5–10 concise bullets and compare realistic alternatives. Do not turn planning into a long essay or delay a simple fix with unnecessary ceremony.

The plan must state:

- **Problem and expected behavior:** what must work, acceptance criteria, and what is out of scope.
- **Current flow and constraints:** relevant files, current request/data flow, technologies and versions, existing conventions, and compatibility requirements.
- **Approaches considered:** normally 2–3 realistic options, including the simplest viable option and using an existing package, managed service, or platform capability when relevant.
- **Trade-off comparison:** compare the options against dimensions that matter here: performance/throughput, latency, direct and operational cost, implementation effort, maintainability, security, reliability, and testability. Tie estimates to this project's actual stack and likely workload. Use a small table when it makes the decision clearer. State assumptions; do not invent benchmarks or precise cost estimates without evidence.
- **Recommendation:** choose one approach and explain why it is proportionate to a small-to-medium project.
- **Implementation and verification:** expected files/modules to change, failure cases to cover, and tests/checks to run.

For routine work, do not force a lengthy alternatives table if there is only one sensible option; state briefly why. If a decision depends on unknown traffic, data volume, budget, latency target, or consistency requirements, state the assumption and ask a question only if the unknown could materially change the design. Otherwise proceed with an explicit, reasonable assumption.

If a decision depends on unknown traffic, data volume, budget, latency target, or consistency requirements, state the assumption and ask a question only if that unknown could materially change the design. Otherwise proceed with an explicit, reasonable assumption.

**Wait for approval before implementation** when the user requests a plan-first review, the change is destructive or breaking, a migration risks data loss, or the choice has significant cost/security/operational consequences. Otherwise, show the plan and proceed in the same task if the workflow allows.

### 1.3 Explore before rebuilding

Before writing a custom implementation, check whether the need is already handled by:

- An existing project module or dependency.
- A maintained package compatible with the current stack.
- The database/ORM, Node.js, Express, or hosting platform.
- A managed provider or external service.
- A standard protocol or established implementation.

Compare **build vs. buy/use** when relevant. Consider total cost, vendor lock-in, privacy/data residency, reliability, rate limits, security posture, integration effort, learning curve, and the cost of operating it. Do not add a new dependency just because it is popular. Do not rebuild mature capabilities such as password hashing, cryptographic primitives, robust validation, or payment processing from scratch.

Use official documentation and the installed package version where possible. If external research is unavailable, say what has not been verified rather than fabricating certainty.

## 2. Architecture: pragmatic layers

Use the following as a default mental model, not a mandatory folder-per-function template:

**Route → middleware → controller → service → repository/data source**

A small feature may use fewer layers. Add a layer when it creates a real boundary, reduces duplication, improves testing, or makes change safer. Do not create a file, class, interface, factory, wrapper, or abstraction solely to follow a pattern.

### Routes

- Declare HTTP method, path, and middleware order.
- Keep routes declarative and thin.
- Do not put business rules or database queries in route files.
- Group routes by resource or domain where it improves navigation.
- Ensure specific routes are not accidentally shadowed by broader routes.

### Middleware

Use middleware for cross-cutting request concerns that apply consistently across many endpoints, such as:

- Authentication and authorization checks where appropriate.
- Request IDs and request context.
- Rate limiting.
- Security headers and CORS.
- Request size/content-type limits.
- Logging and centralized error handling.
- Shared request validation only when that boundary is intentionally chosen by the project.

Middleware must have a clear purpose, documented ordering requirements, and predictable behavior. Do not put all logic into one giant middleware. Do not apply authentication globally to intentionally public endpoints.

### Controllers: HTTP boundary

Controllers own the HTTP boundary and should remain small. In accordance with this project's preferred convention, handle the following at the controller boundary:

- Validate and normalize incoming request data, using an established schema validator when appropriate.
- Deserialize request payloads into the shape expected by the application.
- Transform transport-level data when necessary.
- Call the relevant service(s).
- Serialize and shape the response DTO/public API representation.
- Choose appropriate HTTP status codes and headers.
- Pass errors to the centralized error handler instead of duplicating error-response logic.

Keep validation schemas or response-mapping helpers in separate modules only when they are reusable, substantial, or materially improve clarity. A project may use validation middleware instead if that is already its consistent convention; do not mix approaches randomly.

Controllers must **not** contain complex business rules, long workflows, or direct database queries. Never return internal ORM entities blindly if that would expose secrets, internal fields, or an unstable API contract.

### Services

- Hold business rules and use-case orchestration.
- Coordinate repository calls and, when necessary, other services.
- Enforce domain invariants that must hold regardless of which route calls the use case.
- Avoid depending on Express `req`, `res`, or `next` objects.
- Keep dependencies explicit and avoid circular service dependencies.
- If two services need each other, reconsider ownership, extract a focused shared capability, or orchestrate them from a higher-level use case. Do not casually introduce a service locator or dependency-injection framework for a small project.

### Repositories and data access

- Encapsulate non-trivial persistence logic and queries when doing so clarifies the boundary or improves testing.
- Keep ORM/database details out of controllers.
- Use direct ORM calls from a small service only when a separate repository would add no meaningful value and this is consistent with the codebase.
- Keep queries focused; avoid fetching entire records/relations when only a few fields are needed.
- Use parameterized queries or safe ORM query APIs.
- Use transactions for operations that must succeed or fail together.
- Keep transaction boundaries explicit and avoid holding transactions open during slow network calls.
- Do not build a generic repository framework around every model by default.

### Utilities and shared modules

Create a utility/helper only when behavior is genuinely reused, is a clear standalone concept, or centralizes a risky operation. Do not turn every expression or one-line function into a utility. Avoid vague `helpers.js` or `utils.js` dumping grounds; use descriptive modules and cohesive responsibilities.

### Suggested structure

Adapt this to the existing codebase. Do not reorganize an entire project just to match this example.

```text
src/
  app.js                 # Express app, middleware and route registration
  server.js              # Startup, connection lifecycle and listening
  config/                # Validated environment configuration
  routes/                # Endpoint declarations
  controllers/           # HTTP boundary: validation, mapping, responses
  services/              # Business rules and use cases
  repositories/          # Meaningful persistence/query boundaries
  middleware/             # Shared request pipeline and error handling
  schemas/                # Reused request/response schemas, if useful
  errors/                 # Custom application errors, if useful
  utils/                  # Truly shared utilities only
  integrations/           # External API/client adapters, if needed
  tests/
```

Do not create empty directories or placeholder files. For a small CRUD feature, fewer files may be cleaner. Follow the current repository's conventions unless there is a clear improvement worth explaining.

## 3. SOLID balanced with KISS

Apply SOLID as a set of design checks, not as a demand to maximize abstraction.

- **Single Responsibility:** a module should have one cohesive reason to change, but it may contain several closely related functions.
- **Open/Closed:** use extension points when real variation is expected; do not invent plugin systems for hypothetical futures.
- **Liskov Substitution:** keep compatible contracts when using inheritance or interchangeable implementations; prefer simple composition in ordinary JavaScript code.
- **Interface Segregation:** keep dependencies small and focused; do not create artificial interfaces solely to satisfy a rule.
- **Dependency Inversion:** isolate unstable or external dependencies at useful boundaries when it makes testing or change easier. Do not add a DI container by default.

Prefer KISS, clear names, straightforward control flow, small cohesive modules, explicit dependencies, and boring established patterns. Avoid:

- Over-engineering and speculative generality.
- Deep nesting and clever one-liners that hide behavior.
- Giant controllers/services.
- One class/file per trivial function.
- Duplicate validation, duplicate queries, or duplicate error mapping.
- Multiple layers that only forward arguments without adding value.
- Premature caching, queues, microservices, event buses, or elaborate factories.
- Broad catch blocks that conceal failures.
- Catching an error only to throw the same error without adding context or handling it.

Modularity means responsibilities and dependencies are understandable—not that the project has the maximum number of files.

## 4. API design

Design APIs around client use cases and stable resource contracts.

- Use resource-oriented paths and correct HTTP methods.
- Use status codes consistently: distinguish success, creation, validation failure, unauthenticated, forbidden, not found, conflict, rate limiting, and unexpected server errors.
- Validate path parameters, query parameters, headers, and bodies at the trust boundary.
- Define a consistent response/error shape appropriate to the existing API.
- Use pagination and bounded limits for potentially large lists; choose offset or cursor pagination based on access patterns and scale.
- Avoid leaking database schema details, stack traces, internal paths, secrets, or provider error payloads.
- Make PATCH/PUT semantics explicit.
- Consider idempotency for retryable operations that create payments, orders, or other consequential side effects.
- Use transactions and uniqueness constraints to protect invariants under concurrent requests.
- Keep API documentation/OpenAPI specifications in sync when the project uses them.
- Consider backward compatibility before changing request/response fields or status codes.
- Do not introduce API versioning, GraphQL, or a new API style without a real requirement.

## 5. Database schema, indexes, and query design

Before designing or changing a schema, understand the entities, relationships, invariants, access patterns, expected data volume, and deletion/update behavior.

- Use primary keys, foreign keys, uniqueness constraints, and `NOT NULL` constraints to enforce invariants where appropriate.
- Choose data types and nullability deliberately.
- Model relationships based on real domain semantics, not only on convenience.
- Add indexes to support demonstrated or likely important query patterns: filters, joins, ordering, and uniqueness.
- Evaluate composite-index column order against actual predicates and sort patterns.
- Remember that indexes consume storage and make writes, updates, and deletes more expensive.
- Avoid indexing every column by default.
- Use `EXPLAIN`/query plans and representative data when performance is a concern.
- Avoid N+1 queries and unbounded result sets.
- Prefer database constraints and transactions over fragile application-only checks when the database can enforce the invariant.
- Review migration safety, locking, backfills, rollback limitations, and possible data loss before changing production schemas.
- Never assume a database feature behaves identically across MySQL, PostgreSQL, SQLite, or other engines.

Compare alternatives using the current database and ORM. State expected trade-offs rather than claiming performance gains without measurement.

## 6. Connections and external integrations

### Application and database connections

- Centralize connection configuration and validate required environment variables at startup.
- Use the current driver's/ORM's supported connection pool rather than creating a new connection for each request.
- Define sensible pool limits and connection/acquisition/query timeouts based on deployment limits and expected concurrency.
- Handle startup failure clearly; do not report the server as healthy when required dependencies are unavailable.
- Close the HTTP server and database connections during graceful shutdown.
- Avoid leaking connections, unhandled promises, timers, or event listeners.
- Keep credentials out of source control and logs.

### External services

- Set explicit timeouts; network calls must not wait indefinitely.
- Handle non-2xx responses, malformed payloads, DNS/network failures, and provider rate limits.
- Retry only transient failures, with bounded exponential backoff and jitter where appropriate.
- Do not automatically retry non-idempotent operations unless idempotency is guaranteed.
- Avoid retry storms and retrying permanent client errors.
- Validate and map provider responses at the integration boundary.
- Keep provider-specific details out of core business logic when a small adapter provides a meaningful boundary.
- Use circuit breakers or queues only when the failure mode, workload, or business requirement justifies the extra complexity.

## 7. Global errors and failure handling

Use one predictable error-handling strategy for the whole application.

- Add a final Express error-handling middleware after route registration.
- In Express 4, ensure asynchronous route failures are forwarded correctly, using an established wrapper or explicit `try/catch` plus `next(error)`. Verify the installed Express version's behavior before choosing the implementation.
- In Express 5, rejected promises from supported async handlers are forwarded to error handling; still ensure errors from detached tasks and callbacks are handled.
- Use a small, consistent application-error model when it helps distinguish expected operational errors from programming faults.
- Map known errors to safe HTTP responses; unknown errors should produce a generic 500 response.
- Never expose stack traces, SQL errors, secrets, internal paths, or raw third-party error details to clients in production.
- Log unexpected failures with a request/correlation ID and useful context, without secrets or sensitive personal data.
- Do not send multiple responses for one request.
- Handle errors from background tasks separately; Express middleware does not catch every detached asynchronous failure.
- Treat `uncaughtException` and unhandled rejections as serious process-health issues. Do not pretend that continuing in an unknown state is safe. Use the runtime's supported shutdown/restart strategy.
- Distinguish expected errors (invalid input, missing record, conflict) from unexpected defects.
- Do not swallow errors or convert every failure into a misleading 200 response.

A typical response shape might be:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "requestId": "request-correlation-id"
  }
}
```

Adapt the shape to existing API conventions. Do not return `requestId` unless the application actually creates and propagates one.

## 8. Failure-point analysis and resilience

For each non-trivial feature, explicitly think through its important failure points before implementation. This is a practical checklist, not a promise that every possible failure can be predicted.

Check applicable cases such as:

- Missing, malformed, oversized, or invalid input.
- Unauthenticated requests, insufficient permissions, and access to another user's resource.
- Missing records, duplicate records, uniqueness conflicts, and stale state.
- Database unavailable, pool exhausted, query timeout, transaction failure, and partial operation failure.
- External API timeout, network/DNS/TLS error, non-2xx response, invalid provider payload, rate limit, and provider outage.
- Concurrent requests, duplicate submissions, retries, and race conditions.
- Missing/invalid environment variables, startup failure, and graceful shutdown.
- Serialization errors, unexpected exceptions, and failures in logging or ancillary services.
- Partial writes, file upload/storage errors, and background-task failures where relevant.

For each relevant failure, decide whether to validate, reject, retry, roll back, compensate, degrade gracefully, alert/log, or return a safe error. Do not implement retries or fallback behavior indiscriminately. Avoid hiding failures behind generic success responses. Ensure the chosen behavior is tested where practical.

## 9. Security baseline

Treat every incoming request and external response as untrusted.

- Authenticate users securely and authorize each protected action against the requested resource. Authentication alone is not authorization.
- Prevent insecure direct object reference (IDOR) by checking resource ownership/permissions in the relevant operation.
- Validate input with an established schema validator where appropriate; validation is not a substitute for parameterized queries or authorization.
- Use a maintained password-hashing library and suitable password-hashing settings; never invent cryptographic algorithms.
- Protect secrets using environment/secret management appropriate to deployment.
- Configure CORS for known frontend origins rather than using permissive wildcard settings with credentials.
- Use security headers, body-size limits, rate limiting, and appropriate request timeouts.
- Apply CSRF protection where the authentication/cookie model requires it.
- Set cookies with appropriate `HttpOnly`, `Secure`, and `SameSite` attributes when applicable.
- Keep dependencies updated and review known vulnerabilities.
- Avoid logging authorization headers, session cookies, passwords, access tokens, API keys, or sensitive payloads.
- Use HTTPS in deployment and validate TLS/certificate behavior for external integrations.
- Do not trust client-supplied role, price, ownership, status, or other privileged fields.
- Use least-privilege database and service credentials.
- Avoid unsafe dynamic SQL, unsafe deserialization, path traversal, command injection, and server-side request forgery.
- Review file upload size/type/storage and access controls if uploads exist.
- Do not invent custom authentication, encryption, or token protocols when maintained standards/libraries are available.

Use the current project's authentication model and framework versions. Security middleware alone does not make an API secure; verify authorization and business rules at the operation that needs them.

## 10. Performance, latency, and cost

Optimize based on the actual bottleneck and likely workload.

For meaningful performance decisions, compare the viable approaches across:

- **Latency:** added network hops, query count, serialization, CPU work, cold starts, and queueing.
- **Throughput/resource use:** CPU, memory, database connections, and concurrency.
- **Cost:** hosting, managed services, storage, paid API calls, data transfer, and engineering/operational overhead.
- **Complexity/reliability:** failure modes, observability, deployment, and debugging.

Prefer low-cost, low-complexity improvements first:

1. Avoid unnecessary work and duplicate calls.
2. Fetch only required data and paginate.
3. Use correct constraints and indexes.
4. Remove N+1 queries and serial network calls when safe.
5. Use bounded concurrency for independent work.
6. Cache only when repeated reads, freshness requirements, invalidation, and memory/cost justify it.
7. Add queues, replicas, distributed caches, or other infrastructure only when a concrete workload or reliability need justifies them.

Do not promise that caching, parallelism, a new database, or an index will improve performance without considering access patterns and measurements. Avoid premature optimization, but do not ignore obvious unbounded work or unsafe connection usage.

## 11. Configuration, logging, and lifecycle

- Keep configuration centralized and validate it at startup.
- Separate app construction from starting the listening server when useful for tests.
- Use structured logs when practical; include severity and request ID where available.
- Do not log secrets or full sensitive request bodies.
- Add health/readiness checks appropriate to deployment; do not expose sensitive diagnostics publicly.
- Handle `SIGTERM`/`SIGINT` with graceful shutdown where the deployment environment expects it.
- Close the HTTP server, database pools, and other managed resources.
- Keep development-only debugging details out of production responses.
- Avoid adding a full observability stack to a small project unless needed; use the platform's existing logs and monitoring first.

## 12. Testing and verification

Testing effort should match risk and complexity.

- Test business rules and edge cases in services.
- Test important routes/controllers at the HTTP boundary.
- Test database constraints, transactions, and query behavior where relevant.
- Test authorization failures, invalid inputs, missing resources, conflicts, and unexpected failures.
- Mock external services at useful boundaries, and retain integration tests for critical behavior.
- Avoid brittle tests that assert implementation details rather than behavior.
- Run the project's existing lint, test, type-check (if applicable), and build commands after changes.
- If a check cannot be run, state why and what remains unverified.
- Never claim success for a test or command that was not actually executed.

## 13. Code-generation discipline: no slop

Before writing code, mentally trace the full flow:

1. What enters the system?
2. Where is it validated and normalized?
3. Which controller calls which service?
4. Which repository/database operations occur?
5. What happens on success, invalid input, missing data, permission failure, dependency failure, and unexpected failure?
6. What data is returned to the client, and what must never be exposed?
7. What happens under concurrent requests or retries, if relevant?

Then implement the smallest coherent change.

Every generated line must have a reason. Do not add:

- Unused imports, variables, parameters, files, classes, or dependencies.
- Placeholder abstractions, TODOs, dead code, or commented-out alternatives unless explicitly requested.
- Redundant null checks where the invariant is already guaranteed and clear.
- Duplicate error handling or validation without a boundary-based reason.
- Unnecessary configuration layers, wrappers, or pass-through functions.
- Broad refactors unrelated to the task.
- Claims of production readiness without adequate evidence.

Prefer readable names and explicit control flow over clever compression. Reuse existing conventions. Keep diffs focused and reviewable. After coding, inspect the diff for dead code, duplicated logic, unintended changes, and inconsistencies between modules.

## 14. Final response format

After completing a non-trivial task, report concisely:

1. **What changed** and why.
2. **Key decision/trade-off** when an alternative was considered.
3. **Files or modules affected.**
4. **Verification performed** and actual results.
5. **Remaining risks, assumptions, or follow-up work.**

Do not dump the entire implementation plan again. Do not claim tests, browser checks, security reviews, or benchmarks passed unless they were actually performed.

## Reference material

Use these authoritative resources when relevant; verify that guidance matches the installed versions:

- Express production security: https://expressjs.com/en/advanced/best-practice-security.html
- Express error handling: https://expressjs.com/en/guide/error-handling.html
- Node.js security best practices: https://nodejs.org/en/learn/getting-started/security-best-practices
- Node.js process documentation: https://nodejs.org/api/process.html
- OWASP API Security: https://owasp.org/www-project-api-security/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- Sriniously — Backend from First Principles: https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1
- Sriniously's site and series roadmap: https://www.sriniously.com/

Use Sriniously's series as a conceptual roadmap, not as a command to add every technology to every project. Its roadmap covers HTTP, routing, serialization/deserialization, authentication/authorization, validation/transformation, middleware and request context, controllers/services/repositories, CRUD and REST design, databases, caching, transactional email, queues/scheduling, search, error handling/fault tolerance, configuration, logging/monitoring/observability, graceful shutdown, security, scaling/performance, concurrency/parallelism, object storage, real-time systems, testing/TDD/coverage, Twelve-Factor principles, OpenAPI, webhooks, and DevOps. Select only the concepts relevant to the current feature and project scale. These references inform the skill; they do not override the current project's requirements or official version-specific documentation.
