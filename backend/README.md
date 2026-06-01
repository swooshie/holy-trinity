# Agentify + Valiron Backend

This is the canonical backend for the integrated app.

- route wiring in `server.js`
- trust helper in `src/trust.js`
- chat proxy in `src/chat.js`
- fixture fallback contracts in `src/fixtures.js`
- OpenAPI parser in `src/parser.js`
- trust-gated MCP generator in `src/generator.js`

## 1) Install

```bash
cd backend
npm install
```

## 2) Configure env

```bash
cp .env.example .env
```

Set these values as needed:

- `PORT` (default `3001`)
- `DEMO_FALLBACK_MODE=true|false`
- `ANTHROPIC_API_KEY` (for real chat mode later)
- `VALIRON_API_KEY` (if your Valiron setup needs it)
- `TRUSTED_AGENT_IDS` (comma-separated)

## 3) Run

```bash
npm run dev
```

Health check:

```bash
GET /health
```

## 4) Route contracts

### `POST /api/parse`

Body:

```json
{ "spec": { "openapi": "3.0.0" } }
```

Response: parsed API object contract from docs.

### `POST /api/generate`

Body:

```json
{ "parsedApi": {}, "apiKey": "optional" }
```

Response: generated connector contract from docs.

### `POST /api/trust-check`

Body:

```json
{ "agentId": "25459", "minScore": 65 }
```

Response shape:

```json
{
  "allow": true,
  "score": 85,
  "tier": "AA",
  "riskLevel": "low",
  "route": "stub",
  "message": "Agent 25459 PASSED (score 85, tier AA, min 65)"
}
```

### `POST /api/chat`

Body:

```json
{
  "message": "create task",
  "tools": [],
  "baseUrl": "https://api.example.com",
  "apiKey": "optional",
  "agentId": "25459"
}
```

Returns `reply`, `tool_calls`, and `trust`.

## 5) Integration behavior

- If `DEMO_FALLBACK_MODE=true`, parse/generate/trust/chat use deterministic fixture behavior.
- If `DEMO_FALLBACK_MODE=false`, `/api/parse` uses `src/parser.js` and `/api/generate` uses `src/generator.js`.
- Trust helper uses real Valiron SDK only in non-fallback mode.
- Tool API execution is mocked in fallback mode and live in non-fallback mode.

## 6) Checks

```bash
npm run check
npm test
```

Real parser/generator smoke test:

```bash
DEMO_FALLBACK_MODE=false npm run dev
```

Then post `../specs/gotogether.openapi.json` to `/api/parse` and pass that response to `/api/generate`.

## 7) Notes

- Every error path returns JSON with an `error` field.
- `chatWithTools()` performs preflight trust and per-tool trust checks.
- Blocked tool calls are returned as blocked and are not executed.
