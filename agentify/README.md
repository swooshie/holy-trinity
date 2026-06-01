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

## Smoke Test

From `agentify/backend`:

```bash
npm run check
node -e "const spec=require('../specs/gotogether.openapi.json'); const {parseSpec}=require('./src/parser'); const {generateServer}=require('./src/generator'); parseSpec(spec).then((parsed)=>console.log(generateServer(parsed).trust_config))"
```
