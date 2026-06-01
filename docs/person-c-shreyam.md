# Person C: Shreyam Borah

## Role

Shreyam owns the frontend experience.

Primary outcome:

> A user can paste an API spec, review trust-gated actions, generate a connector, test trusted vs untrusted agents, and copy/use the final config.

## Owned Files

- `frontend/src/App.jsx`
- `frontend/src/api.js`
- `frontend/src/screens/PasteScreen.jsx`
- `frontend/src/screens/ActionsScreen.jsx`
- `frontend/src/screens/GenerateScreen.jsx`
- `frontend/src/screens/TryItScreen.jsx`
- `frontend/src/screens/TakeHomeScreen.jsx`
- Frontend styling files

## Phase 0 User Stories

### C0.1 Build App Shell

As a demo user, I want a clear five-step flow so I understand where I am in the connector generation process.

Acceptance criteria:

- App has five screens.
- App has progress/navigation state.
- User can move from paste to take-home using fixture data.
- State is preserved between screens.

### C0.2 Build Against Fixtures

As Shreyam, I need to build without waiting for backend completion.

Acceptance criteria:

- Frontend can use local mock parsed data.
- Frontend can use local mock generated connector data.
- Frontend can use mock trusted and untrusted chat responses.
- Switching to real API calls requires minimal changes in `api.js`.

## Phase 1 User Stories

### C1.1 Paste API Screen

As an API owner, I want to paste my OpenAPI spec so Agentify can discover actions.

Acceptance criteria:

- Screen includes a large textarea.
- Screen includes a clear action button.
- Loading and error states are shown.
- Parsed result moves user to actions review.

### C1.2 Actions and Trust Threshold Screen

As an API owner, I want to review discovered actions and set trust thresholds so I control which agents can use sensitive tools.

Acceptance criteria:

- Each action is shown with name, method, and path.
- Each action can be enabled or disabled.
- Each enabled action has a `0` to `100` trust slider.
- Slider updates are stored in app state.
- UI distinguishes low, medium, and high trust thresholds.

### C1.3 Generate Screen

As an API owner, I want to generate a trust-gated connector and see that Valiron is included.

Acceptance criteria:

- Generate action sends edited parsed data.
- Screen shows generation progress.
- Screen confirms Valiron trust layer is enabled.
- Generated result is stored in app state.

### C1.4 Try It Screen

As a demo user, I want to test the same request as a trusted and untrusted agent so I can see trust gating work.

Acceptance criteria:

- Screen has trusted/untrusted agent toggle.
- Selected agent ID is sent to backend.
- Chat input sends a request to `/api/chat`.
- Trust result appears before the assistant response.
- Passing trust card is visually distinct from blocked trust card.
- Tool calls are visible enough for the demo.

### C1.5 Take Home Screen

As an API owner, I want the config and generated connector details so I can use the result after the demo.

Acceptance criteria:

- Shows MCP config snippet.
- Shows generated tools or trust config summary.
- Shows connector URL if available.
- Makes clear that Valiron is built into the generated connector.

## Phase 2 User Stories

### C2.1 Connect To Real Backend

As a user, I want the frontend to use real parse, generate, chat, and trust responses.

Acceptance criteria:

- `api.js` has functions for parse, generate, chat, and trust check.
- API base URL is configurable.
- Frontend handles backend errors cleanly.
- Mock mode can still be used for demo fallback.

### C2.2 Preserve Trust Thresholds Through Generation

As an API owner, I want my slider changes to affect the generated connector.

Acceptance criteria:

- Edited `trustThreshold` values are included in `/api/generate` payload.
- Disabled actions remain disabled in `/api/generate` payload.
- Generated trust config reflects frontend edits.

## Phase 3 User Stories

### C3.1 Polish Demo Flow

As the team, we need the live demo to be fast, legible, and reliable.

Acceptance criteria:

- Demo request is prefilled or easy to enter.
- Trusted and untrusted modes are obvious.
- Loading states do not obscure the result.
- Error states have plain-language messages.
- The blocked path is visually clear.

### C3.2 Prepare Submission Video UI

As the team, we need the app to read well in a 120-second recording.

Acceptance criteria:

- Text is legible on screen recording.
- Five-step flow can be completed quickly.
- Trust sliders and trust cards are visible.
- No unnecessary screens or setup steps appear during recording.

## Non-Goals

- Shreyam does not own parser internals.
- Shreyam does not own Valiron SDK integration.
- Shreyam does not own Claude/tool execution behavior.

## Handoff Checklist

- App runs locally.
- Frontend API base URL is documented.
- Mock mode works.
- Real backend mode works when Saloni's backend is running.
- Demo flow is tested with the locked request.
