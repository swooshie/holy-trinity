# Person B: Saloni Saraf

## Role

Saloni owns the backend application shell, trust helper, chat proxy, and demo integration.

Primary outcome:

> The frontend can call backend routes to parse, generate, check trust, and try tools with trusted or untrusted agents.

## Owned Files

- `backend/server.js`
- `backend/src/trust.js`
- `backend/src/chat.js`
- Backend environment/config docs
- Deployment and demo run scripts if needed

## Phase 0 User Stories

### B0.1 Stub Backend Routes

As Shreyam, I need backend routes available early so frontend integration can begin before parser and generator are complete.

Acceptance criteria:

- `POST /api/parse` exists.
- `POST /api/generate` exists.
- `POST /api/chat` exists.
- `POST /api/trust-check` exists.
- Routes can return fixture responses matching `docs/execution-phases.md`.

### B0.2 Stub Trust Results

As the team, we need deterministic trusted and untrusted results so the demo UI can be built without depending on Valiron availability.

Acceptance criteria:

- A trusted placeholder agent returns `allow: true`.
- An untrusted placeholder agent returns `allow: false`.
- Response shape matches the shared trust result contract.
- Stub mode can later be replaced or controlled by an env var.

## Phase 1 User Stories

### B1.1 Implement Backend Route Wiring

As the frontend, I want a single backend API surface so each screen can call the correct operation.

Acceptance criteria:

- Server uses Express with JSON body parsing and CORS.
- `/api/parse` calls `parseSpec`.
- `/api/generate` calls `generateServer`.
- `/api/chat` calls `chatWithTools`.
- `/api/trust-check` calls `checkTrust`.
- Errors return JSON with an `error` field.

### B1.2 Implement Valiron Trust Helper

As the app, I want one trust helper so trust behavior is consistent between direct checks and chat/tool calls.

Acceptance criteria:

- `checkTrust(agentId, minScore)` exists.
- Missing `agentId` returns blocked.
- Real Valiron SDK is used when configured.
- Result includes `allow`, `score`, `tier`, `riskLevel`, `route`, and `message`.
- SDK errors return a controlled error result.

### B1.3 Implement Chat Proxy

As a user, I want to ask a natural language request and have the backend call tools only when trust allows it.

Acceptance criteria:

- `chatWithTools(message, tools, baseUrl, apiKey, agentId)` exists.
- Chat response includes `reply`, `tool_calls`, and `trust`.
- Pre-flight trust check runs for UI display.
- Each selected tool has its own trust check.
- Blocked tools do not call the target API.
- Successful tools call the target API and return results to Claude.

## Phase 2 User Stories

### B2.1 Integrate With Aditya's Parser and Generator

As the team, we need the real backend routes connected to the real parser and generator.

Acceptance criteria:

- `/api/parse` returns real parsed actions.
- `/api/generate` returns real generated connector metadata.
- Stub mode remains available for demo fallback.
- Contract mismatches are fixed or documented immediately.

### B2.2 Integrate With Shreyam's Frontend

As a demo user, I want the frontend to show real backend results.

Acceptance criteria:

- Frontend can parse a spec through the backend.
- Frontend can generate a connector through the backend.
- Frontend can send `agentId` to `/api/chat`.
- Frontend receives and displays trust results.

## Phase 3 User Stories

### B3.1 Confirm Real Demo Agent IDs

As the team, we need reliable trusted and untrusted Valiron agent IDs for the live demo.

Acceptance criteria:

- Trusted agent score is at or above the selected demo threshold.
- Untrusted agent score is below the selected demo threshold.
- Both IDs are documented for the team.
- Both IDs are tested through `/api/trust-check`.

### B3.2 Harden Demo Runtime

As the team, we need the demo to work even when external services are slow or unavailable.

Acceptance criteria:

- Backend has clear required env vars.
- Demo fallback mode is available.
- Claude errors return a useful frontend-safe response.
- Valiron errors do not crash the backend.
- Locked demo request works five times in a row.

## Non-Goals

- Saloni does not own UI layout or styling.
- Saloni does not own OpenAPI parsing internals.
- Saloni does not own generated MCP server internals beyond integration requirements.

## Handoff Checklist

- Backend routes are running.
- Trust helper returns agreed shape.
- Chat proxy returns agreed shape.
- Real and fallback trust modes are documented.
- Shreyam has the backend URL and route examples.

## Implementation Status (June 1, 2026)

Current status of Person B scope in this repository:

- B0.1 Stub Backend Routes: Complete
	- Implemented in `backend/server.js` with all expected routes:
		- `POST /api/parse`
		- `POST /api/generate`
		- `POST /api/chat`
		- `POST /api/trust-check`
	- Fixture responses provided by `backend/src/fixtures.js`.

- B0.2 Stub Trust Results: Complete
	- Deterministic trust behavior implemented in `backend/src/trust.js` when `DEMO_FALLBACK_MODE=true`.
	- Trusted IDs are configurable with `TRUSTED_AGENT_IDS`.

- B1.1 Backend Route Wiring: Complete
	- Express + JSON body parsing + CORS implemented in `backend/server.js`.
	- Route handlers call parse/generate/chat/trust helpers.
	- Error responses return JSON with `error` field.

- B1.2 Valiron Trust Helper: Complete
	- `checkTrust(agentId, minScore)` implemented in `backend/src/trust.js`.
	- Missing `agentId` blocks request.
	- Real Valiron mode enabled with `DEMO_FALLBACK_MODE=false`.
	- SDK compatibility supports both modern `gate()` and legacy profile/route methods.
	- Response includes `allow`, `score`, `tier`, `riskLevel`, `route`, `message`.

- B1.3 Chat Proxy: Complete (initial backend-safe implementation)
	- `chatWithTools(...)` implemented in `backend/src/chat.js`.
	- Pre-flight trust check + per-tool trust checks are enforced.
	- Blocked tools do not execute target API calls.
	- Returns `reply`, `tool_calls`, and `trust`.

- B2.1 Parser/Generator Integration: Partial
	- `backend/server.js` dynamically imports `src/parser.js` and `src/generator.js` when fallback mode is off.
	- Real parser/generator modules must be supplied by Person A for full completion.

- B2.2 Frontend Integration: Pending verification
	- Backend API is ready for frontend integration.
	- Full E2E verification with frontend is pending.

- B3.1 Real Demo Agent IDs: Pending
	- Needs confirmed trusted/untrusted IDs from Valiron playground and test evidence.

- B3.2 Demo Runtime Hardening: Partial
	- Env template and fallback mode documented in `backend/.env.example` and `backend/README.md`.
	- Need repeated locked-request reliability tests and full Claude error path hardening.
