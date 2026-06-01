# Person A: Aditya Jhaveri

## Role

Aditya owns the OpenAPI parser and the trust-gated MCP server generator.

Primary outcome:

> Given an OpenAPI spec and edited action thresholds, generate a working MCP server where every tool call is protected by a Valiron trust gate.

## Owned Files

- `backend/src/parser.js`
- `backend/src/generator.js`
- `backend/generated/**`
- Parser/generator fixtures used by the rest of the team

## Phase 0 User Stories

### A0.1 Define Parsed API Contract

As Saloni and Shreyam, we need a stable parsed API response shape so backend routes and frontend screens can be built before the real parser is complete.

Acceptance criteria:

- A fixture parsed API object exists.
- The fixture includes `api_name`, `api_description`, `base_url`, and `actions`.
- Each action includes `id`, `name`, `description`, `method`, `path`, `parameters`, `enabled`, and `trustThreshold`.

### A0.2 Define Generated Connector Contract

As Saloni and Shreyam, we need a stable generated connector response so chat and take-home screens can be implemented without waiting on generation.

Acceptance criteria:

- A fixture generated response exists.
- The response includes `server_dir`, `server_code`, `tools`, `config_snippet`, and `trust_config`.
- Each tool includes `name`, `description`, `endpoint`, `method`, `trustThreshold`, and `input_schema`.

## Phase 1 User Stories

### A1.1 Parse OpenAPI Specs Into Actions

As an API owner, I want my OpenAPI spec converted into clear actions so I can choose which tools agents are allowed to use.

Acceptance criteria:

- Parser accepts either a JSON object or JSON string.
- Parser dereferences OpenAPI schemas.
- Parser supports `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- Parser extracts path, query, and body parameters.
- Parser returns stable lowercase action IDs.

### A1.2 Assign Default Trust Thresholds

As an API owner, I want sensitive actions to start with higher trust requirements so dangerous operations are safer by default.

Acceptance criteria:

- `GET` defaults to `45`.
- `POST`, `PUT`, and `PATCH` default to `65`.
- `DELETE` defaults to `85`.
- The frontend can override the value before generation.

### A1.3 Generate Trust-Gated MCP Server

As an API owner, I want the generated connector to enforce Valiron trust checks before API calls so untrusted agents cannot use protected tools.

Acceptance criteria:

- Generated `server.js` imports `@valiron/sdk`.
- Generated server creates a `ValironSDK` instance.
- Each generated tool checks `valiron.gate(agentId, { minScore })`.
- Agent ID is read from `x-agent-id` or `DEFAULT_AGENT_ID`.
- Failed trust checks return an error response and do not execute the API call.
- Successful checks execute the API call.

### A1.4 Generate Tool Metadata

As Saloni, I need generated tool metadata so the chat proxy can expose tools to Claude and enforce per-tool trust.

Acceptance criteria:

- `tools.json` is generated.
- Each tool has an Anthropic-compatible `input_schema`.
- Each tool includes `trustThreshold`.
- Each tool includes endpoint and HTTP method.

## Phase 2 User Stories

### A2.1 Integrate Parser With Backend Route

As a user, I want `/api/parse` to return real actions from my pasted spec.

Acceptance criteria:

- Saloni can call `parseSpec(spec)` from `server.js`.
- Invalid specs return useful errors.
- At least one real sponsor/demo spec parses successfully.

### A2.2 Integrate Generator With Backend Route

As a user, I want `/api/generate` to use my edited thresholds when creating the connector.

Acceptance criteria:

- `generateServer(parsed, apiKey)` accepts frontend-edited action objects.
- Disabled actions are excluded.
- Edited `trustThreshold` values appear in generated server code and `tools.json`.

## Phase 3 User Stories

### A3.1 Pre-Bake Demo Connector

As the team, we need a known-good connector ready before the live demo.

Acceptance criteria:

- Demo connector is generated from the selected API spec.
- Generated server starts locally or on the deployment target.
- `/health` shows `trustGated: true`.
- Tool thresholds match the demo script.

## Non-Goals

- Aditya does not own the frontend UI.
- Aditya does not own Claude chat behavior.
- Aditya does not own deployment unless needed for generator debugging.

## Handoff Checklist

- Parser returns the agreed contract.
- Generator returns the agreed contract.
- Generated connector has installable `package.json`.
- Generated connector has a working `/health` endpoint.
- Any contract change is reflected in `docs/execution-phases.md`.
