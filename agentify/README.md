# Agentify + Valiron Trust Layer

Proof of concept for turning an OpenAPI spec into a trust-gated MCP connector.

## Project Structure

```text
backend/
  server.js
  src/
    parser.js
    generator.js
    trust.js
    chat.js
    fixtures.js
  generated/
frontend/
  src/
    App.jsx
    api.js
    screens/
specs/
  gotogether.openapi.json
```

## Backend

```bash
cd agentify/backend
npm install
npm run dev
```

Routes:

- `POST /api/parse`
- `POST /api/generate`
- `POST /api/chat`
- `POST /api/trust-check`
- `GET /health`

Fixture mode can be forced with:

```bash
AGENTIFY_FIXTURE_MODE=true npm run dev
```

Trust mode defaults to deterministic demo behavior:

- `trusted-agent` passes with score `90`
- `untrusted-agent` blocks with score `25`

Live Valiron mode:

```bash
VALIRON_API_KEY=... AGENTIFY_TRUST_MODE=live npm run dev
```

Tool execution is mocked unless explicitly enabled:

```bash
AGENTIFY_EXECUTE_TOOLS=true npm run dev
```

## Frontend

```bash
cd agentify/frontend
npm install
npm run dev
```

Frontend API base URL defaults to `http://localhost:3001`.

```bash
VITE_API_BASE_URL=http://localhost:3001 npm run dev
```

Mock mode can be forced with:

```bash
VITE_USE_MOCKS=true npm run dev
```

## One-Command Dev

After installing backend and frontend dependencies:

```bash
cd agentify
npm run dev
```

This starts the backend on `http://localhost:3001` and the frontend on `http://127.0.0.1:5173`.

Run all local checks from `agentify`:

```bash
npm run check
```

Run backend route smoke tests while the backend is running:

```bash
npm run smoke
```

## Smoke Test

From `agentify/backend`:

```bash
npm run check
npm test
node -e "const spec=require('../specs/gotogether.openapi.json'); const {parseSpec}=require('./src/parser'); const {generateServer}=require('./src/generator'); parseSpec(spec).then((parsed)=>console.log(generateServer(parsed).trust_config))"
```

## No-Key Demo Path

No external API keys are required for the default demo.

- Trust checks use deterministic local results.
- Chat tool selection uses deterministic local behavior.
- Target API execution is mocked.
- `trusted-agent` passes.
- `untrusted-agent` blocks.

Keep these unset or false for the no-key demo:

```bash
AGENTIFY_TRUST_MODE=deterministic
AGENTIFY_CHAT_MODE=deterministic
AGENTIFY_EXECUTE_TOOLS=false
```

Live integrations can be enabled later by Saloni or whoever owns the keys:

```bash
VALIRON_API_KEY=...
ANTHROPIC_API_KEY=...
AGENTIFY_TRUST_MODE=live
AGENTIFY_CHAT_MODE=live
```
