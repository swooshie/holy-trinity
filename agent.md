# Agentify + Valiron Trust Layer

## Project Brief

Build a proof of concept that turns an OpenAPI spec into a trust-gated MCP connector.

Original Agentify flow:

1. Paste an API spec.
2. Review generated actions.
3. Generate an MCP server.
4. Try the connector live.
5. Take home the config and generated code.

Valiron-enhanced flow:

1. Paste an OpenAPI spec.
2. Review actions with per-action trust thresholds.
3. Generate an MCP server that includes Valiron trust checks.
4. Try the connector with a trusted agent and an untrusted agent.
5. Download/use the generated trust-gated connector.

Every generated tool call must check the calling agent's Valiron score before executing. If the score is below the tool threshold, the request is blocked.

## Product Goal

The demo should make this clear:

> Agentify makes any product agent-usable. Valiron makes sure only trusted agents get through.

The dramatic moment is the same request succeeding for a trusted agent and getting blocked for an untrusted agent.

## Team Plan

Detailed implementation docs live in [`docs/`](./docs/README.md).

Ownership:

- Person A: Aditya Jhaveri owns parser and trust-gated MCP generation.
- Person B: Saloni Saraf owns backend routes, trust helpers, chat proxy, and demo integration.
- Person C: Shreyam Borah owns the frontend.

Parallelization rule:

- Aditya and Saloni should be able to code in parallel by agreeing on response contracts first.
- Saloni should stub backend routes with fixture data before Aditya's parser/generator are complete.
- Shreyam should build frontend screens against fixture or mocked API responses first.
- Real integration happens after each person has a working independent slice.

Docs:

- [`docs/execution-phases.md`](./docs/execution-phases.md): shared contracts, phases, dependencies, and integration plan.
- [`docs/person-a-aditya.md`](./docs/person-a-aditya.md): Aditya's user stories and acceptance criteria.
- [`docs/person-b-saloni.md`](./docs/person-b-saloni.md): Saloni's user stories and acceptance criteria.
- [`docs/person-c-shreyam.md`](./docs/person-c-shreyam.md): Shreyam's frontend user stories and acceptance criteria.

## Architecture

```text
Paste API
  -> Parser
  -> Actions with trust thresholds
  -> Generator
  -> Trust-gated MCP server
  -> Valiron gate before every tool call
  -> Execute API call or return 403-style blocked result
```

Core behavior:

- Parse OpenAPI paths into actions.
- Assign a default `trustThreshold` to each action.
- Let the user adjust thresholds in the UI.
- Generate an MCP server with `@valiron/sdk`.
- Read the calling agent ID from `x-agent-id`.
- Call `valiron.gate(agentId, { minScore })` before tool execution.
- Allow the API call only when `gate.allow` is true.

## Suggested Project Structure

```text
agentify/
  backend/
    package.json
    server.js
    src/
      parser.js
      generator.js
      chat.js
      trust.js
    generated/
  frontend/
    src/
      App.jsx
      screens/
        PasteScreen.jsx
        ActionsScreen.jsx
        GenerateScreen.jsx
        TryItScreen.jsx
        TakeHomeScreen.jsx
      api.js
  specs/
  README.md
```

## Backend Requirements

### Dependencies

Backend should include:

- `@anthropic-ai/sdk`
- `@apidevtools/swagger-parser`
- `@modelcontextprotocol/sdk`
- `@valiron/sdk`
- `cors`
- `express`
- `zod`

### API Routes

Implement these backend routes:

- `POST /api/parse`
  - Input: OpenAPI spec.
  - Output: parsed API metadata and action list.

- `POST /api/generate`
  - Input: parsed API object and optional API key.
  - Output: generated MCP server code, tools list, config snippet, and trust config.

- `POST /api/chat`
  - Input: message, tools, base URL, API key, and `agentId`.
  - Output: assistant reply, tool calls, and trust result.

- `POST /api/trust-check`
  - Input: `agentId` and `minScore`.
  - Output: Valiron trust evaluation.

## Parser Requirements

The parser should:

- Accept an OpenAPI spec as an object or JSON string.
- Dereference the spec with Swagger Parser.
- Extract actions from `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` operations.
- Extract path, query, and body parameters.
- Generate stable action IDs.
- Add a default `trustThreshold` to every action.

Default trust thresholds:

- `DELETE`: `85`
- `POST`, `PUT`, `PATCH`: `65`
- `GET`: `45`

Each action should include:

- `id`
- `name`
- `description`
- `method`
- `path`
- `parameters`
- `enabled`
- `trustThreshold`

## Generator Requirements

The generated MCP server must:

- Include `@valiron/sdk`.
- Create a `ValironSDK` instance.
- Register one MCP tool per enabled action.
- Use each action's `trustThreshold`.
- Read the agent ID from `extra?.headers?.['x-agent-id']` or `DEFAULT_AGENT_ID`.
- Call `valiron.gate(agentId, { minScore: threshold })`.
- Return an error response when the agent fails the trust check.
- Execute the API request only after the trust gate passes.
- Expose `/mcp` for MCP transport.
- Expose `/health` with trust-gating metadata.

Generated output should include:

- `server.js`
- `package.json`
- `tools.json`
- MCP config snippet
- trust config summary

## Trust Helper Requirements

Create `src/trust.js` to wrap Valiron checks.

Expected function:

```js
async function checkTrust(agentId, minScore = 65)
```

Behavior:

- If no agent ID is supplied, return a blocked result.
- Call `valiron.gate(agentId, { minScore })`.
- Return `allow`, `score`, `tier`, `riskLevel`, `route`, and a human-readable message.
- On SDK error, return a blocked error result.

## Chat Proxy Requirements

`chat.js` should:

- Accept `agentId`.
- Do a pre-flight trust check for UI display.
- Block immediately if the agent cannot pass the lowest required threshold.
- Call Claude with the generated tools.
- Before each selected tool call, check the specific tool's trust threshold.
- Execute the API call only when the per-tool trust check passes.
- Return the assistant reply, tool calls, and trust result to the frontend.

## Frontend Requirements

Build a five-screen flow:

1. `PasteScreen`
   - Textarea for OpenAPI spec.
   - Button to parse/generate actions.

2. `ActionsScreen`
   - Show detected actions.
   - Allow actions to be enabled/disabled.
   - Include a trust threshold slider from `0` to `100` for each action.
   - Show a simple label for low, medium, or high trust thresholds.

3. `GenerateScreen`
   - Show generation progress.
   - Include visible confirmation that the Valiron trust layer is enabled.

4. `TryItScreen`
   - Include a trusted/untrusted agent selector.
   - Send the selected `agentId` to the backend.
   - Show a trust evaluation card before the assistant response.
   - Show pass state in green and blocked state in red.

5. `TakeHomeScreen`
   - Show config snippet.
   - Show generated code/download instructions.
   - Make it clear that Valiron is baked into the generated connector.

## Demo Agents

Use real Valiron playground agent IDs when possible.

Demo needs:

- Trusted agent: score at or above the target threshold, for example `>= 65`.
- Untrusted agent: score below the target threshold or unknown.

The source plan used placeholder IDs:

- Trusted: `25459`
- Untrusted: `99999`

Replace these with confirmed Valiron playground IDs before the live demo.

## Demo Script

1. Open with the problem:
   - Products want to be usable by AI assistants, but not by every unknown agent.

2. Paste an OpenAPI spec:
   - Show Agentify detecting actions.

3. Review actions and thresholds:
   - Explain that each action has a Valiron trust threshold.
   - Safer reads can have lower thresholds.
   - Sensitive writes and deletes should have higher thresholds.

4. Try with a trusted agent:
   - Select the trusted agent.
   - Send the locked request.
   - Show the green trust card.
   - Show the tool executing.

5. Try with an untrusted agent:
   - Select the untrusted agent.
   - Send the same request.
   - Show the red blocked trust card.
   - Confirm no API call is made.

6. Close:
   - Agentify makes products agent-usable.
   - Valiron makes agent access trust-aware.

## Pre-Stage Checklist

- Frontend live URL works.
- Pre-baked trust-gated connector is deployed.
- Trusted demo agent ID is confirmed.
- Untrusted demo agent ID is confirmed.
- Locked demo request works with both agents.
- `ANTHROPIC_API_KEY` is set on the backend.
- Valiron SDK can reach the Valiron API from hosting.
- Backup video is recorded.
- Laptop and screen mirroring are tested.

## Submission Checklist

- Public GitHub repo contains hackathon code only.
- App is deployed and demo-ready.
- 120-second video shows:
  - paste spec
  - trust sliders
  - generate connector
  - trusted agent succeeds
  - untrusted agent is blocked
- Submission is completed before the deadline.

## Implementation Notes

- The generated trust gate may fail open for demo resilience, but production should fail closed.
- Tool descriptions should be clear enough for Claude to select the right action.
- The UI should make the trust decision visible before showing the tool result.
- The blocked path is as important as the successful path.
