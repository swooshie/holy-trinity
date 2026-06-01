# Execution Phases

## Team Ownership

| Person | Owner | Main Role | Primary Files |
| --- | --- | --- | --- |
| A | Aditya Jhaveri | Parser and trust-gated MCP generator | `backend/src/parser.js`, `backend/src/generator.js`, generated server output |
| B | Saloni Saraf | Backend API, trust checks, chat proxy, deployment/demo glue | `backend/server.js`, `backend/src/trust.js`, `backend/src/chat.js` |
| C | Shreyam Borah | Frontend flow and demo UI | `frontend/src/**` |

## Dependency Strategy

The project should be built so Person A and Person B can work independently as much as possible.

- Aditya should publish the parse/generate response contract early, then build implementation behind it.
- Saloni should build backend routes and chat/trust behavior against fixture data before Aditya's generator is complete.
- Shreyam should build the frontend against mock API responses first, then swap to real backend calls.
- Integration should happen only after each person has a working slice.

## Shared Contracts

### Parsed API Shape

```json
{
  "api_name": "GoTogether",
  "api_description": "Example API",
  "base_url": "https://api.example.com",
  "actions": [
    {
      "id": "create_task",
      "name": "Create task",
      "description": "Create a new task",
      "method": "POST",
      "path": "/tasks",
      "parameters": [
        {
          "name": "title",
          "type": "string",
          "required": true,
          "description": "Task title",
          "in": "body"
        }
      ],
      "enabled": true,
      "trustThreshold": 65
    }
  ]
}
```

### Generated Connector Shape

```json
{
  "server_dir": "backend/generated/gotogether",
  "server_code": "const ...",
  "tools": [
    {
      "name": "create_task",
      "description": "Create a new task",
      "endpoint": "/tasks",
      "method": "POST",
      "trustThreshold": 65,
      "input_schema": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Task title"
          }
        },
        "required": ["title"]
      }
    }
  ],
  "config_snippet": {
    "mcpServers": {
      "gotogether": {
        "url": "http://localhost:3001/mcp"
      }
    }
  },
  "trust_config": [
    {
      "tool": "create_task",
      "name": "Create task",
      "minScore": 65
    }
  ]
}
```

### Trust Result Shape

```json
{
  "allow": true,
  "score": 85,
  "tier": "AA",
  "riskLevel": "low",
  "route": "prod",
  "message": "Agent 25459 PASSED (score 85, tier AA)"
}
```

### Chat Response Shape

```json
{
  "reply": "Created the task.",
  "tool_calls": [
    {
      "tool": "create_task",
      "input": {
        "title": "ship demo"
      }
    }
  ],
  "trust": {
    "allow": true,
    "score": 85,
    "tier": "AA",
    "message": "Agent 25459 PASSED (score 85, tier AA)"
  }
}
```

## Phase 0: Contract and Fixtures

Goal: unblock everyone immediately.

Aditya:

- Define the parsed API shape.
- Create one fixture parsed API response.
- Create one fixture generated connector response.

Saloni:

- Stub backend routes using fixture responses.
- Stub `checkTrust()` with deterministic trusted/untrusted agent IDs.
- Stub `chatWithTools()` so frontend integration can begin.

Shreyam:

- Build frontend screens against mock data or stubbed backend routes.
- Implement state flow across all five screens.

Exit criteria:

- Frontend can move through all five screens with fixture data.
- Backend has all expected route names.
- Contracts are stable enough for integration.

## Phase 1: Independent Core Build

Goal: each person completes their owned slice without waiting on the others.

Aditya:

- Implement real OpenAPI parsing.
- Implement trust threshold defaults.
- Implement generated MCP server code.
- Generate `tools.json`, `package.json`, and config snippet.

Saloni:

- Implement real `server.js` route wiring.
- Implement Valiron trust helper.
- Implement chat proxy with pre-flight and per-tool trust checks.
- Keep mocked fallback behavior for demos.

Shreyam:

- Finish trust threshold controls.
- Finish trusted/untrusted demo toggle.
- Finish trust evaluation cards.
- Finish take-home/config screen.

Exit criteria:

- Parser works on at least one real spec.
- Backend trust check route returns expected pass/block results.
- Frontend demo flow works with mocked or real backend responses.

## Phase 2: Integration

Goal: connect the real pieces.

Tasks:

- Connect `POST /api/parse` to Aditya's parser.
- Connect `POST /api/generate` to Aditya's generator.
- Connect frontend API client to Saloni's backend routes.
- Confirm generated `tools` shape is accepted by `chat.js`.
- Confirm frontend preserves edited `trustThreshold` values before generation.

Exit criteria:

- Pasting a real spec creates real actions.
- Edited thresholds appear in generated output.
- Try-it screen sends selected `agentId`.
- Backend returns trust result to frontend.

## Phase 3: Demo Hardening

Goal: make the pitch reliable.

Tasks:

- Confirm real trusted and untrusted Valiron agent IDs.
- Pre-generate the sponsor/demo connector.
- Test the locked request with both agents at least five times.
- Add backup fixture mode if Valiron or Claude is unavailable.
- Record a backup video of trusted success and untrusted block.

Exit criteria:

- Trusted path succeeds.
- Untrusted path blocks without making the API call.
- Demo can still be shown if an external service fails.

## Phase 4: Submission

Goal: package the project cleanly.

Tasks:

- Clean README and setup instructions.
- Verify environment variables are documented.
- Verify public repo contains no secrets.
- Record 120-second submission video.
- Submit before deadline.

## Parallel Work Rules

- Do not change another person's owned files without telling them.
- If a contract must change, update this file first.
- Keep fixture data working even after real integrations are added.
- Use environment variables for API keys and demo modes.
- Prefer deterministic demo fallbacks over live-only behavior.
