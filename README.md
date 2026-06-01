# Agentify + Valiron Trust Layer

Canonical app structure:

```text
backend/
frontend/
specs/
docs/
```

Run backend:

```bash
cd backend
npm install
npm run dev
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Default mode requires no external API keys. `DEMO_FALLBACK_MODE=true` uses deterministic trust and mocked tool execution.

Use live mode only after adding local, untracked secrets to `backend/.env`:

```env
DEMO_FALLBACK_MODE=false
VALIRON_API_KEY=...
ANTHROPIC_API_KEY=...
```

Do not commit `.env`.
