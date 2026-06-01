const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const FORCE_MOCK = import.meta.env.VITE_USE_MOCKS === 'true'

// ── Mock fixtures (matches backend GoTogether rides fixture) ──────────────────

const MOCK_PARSED = {
  api_name: 'GoTogether',
  api_description: 'Example ride coordination API for the Agentify + Valiron demo.',
  base_url: 'https://api.gotogether.example.com',
  actions: [
    {
      id: 'list_rides',
      name: 'List rides',
      description: 'List available rides.',
      method: 'GET',
      path: '/rides',
      parameters: [{ name: 'city', type: 'string', required: false, description: 'City to search for rides in.', in: 'query' }],
      enabled: true,
      trustThreshold: 45,
    },
    {
      id: 'create_ride',
      name: 'Create ride',
      description: 'Create a new ride listing.',
      method: 'POST',
      path: '/rides',
      parameters: [
        { name: 'origin', type: 'string', required: true, description: 'Ride origin.', in: 'body' },
        { name: 'destination', type: 'string', required: true, description: 'Ride destination.', in: 'body' },
        { name: 'seats', type: 'number', required: true, description: 'Number of seats available.', in: 'body' },
      ],
      enabled: true,
      trustThreshold: 65,
    },
    {
      id: 'delete_ride',
      name: 'Delete ride',
      description: 'Delete a ride listing.',
      method: 'DELETE',
      path: '/rides/{rideId}',
      parameters: [{ name: 'rideId', type: 'string', required: true, description: 'Ride identifier.', in: 'path' }],
      enabled: true,
      trustThreshold: 85,
    },
  ],
}

const MOCK_GENERATED = {
  server_dir: 'backend/generated/gotogether',
  server_code: '// Generated trust-gated MCP server. Run /api/generate for the full output.',
  tools: [
    {
      name: 'list_rides',
      description: 'List available rides.',
      endpoint: '/rides',
      method: 'GET',
      trustThreshold: 45,
      input_schema: { type: 'object', properties: { city: { type: 'string', description: 'City to search for rides in.' } }, required: [] },
    },
    {
      name: 'create_ride',
      description: 'Create a new ride listing.',
      endpoint: '/rides',
      method: 'POST',
      trustThreshold: 65,
      input_schema: {
        type: 'object',
        properties: {
          origin: { type: 'string', description: 'Ride origin.' },
          destination: { type: 'string', description: 'Ride destination.' },
          seats: { type: 'number', description: 'Number of seats available.' },
        },
        required: ['origin', 'destination', 'seats'],
      },
    },
    {
      name: 'delete_ride',
      description: 'Delete a ride listing.',
      endpoint: '/rides/{rideId}',
      method: 'DELETE',
      trustThreshold: 85,
      input_schema: { type: 'object', properties: { rideId: { type: 'string', description: 'Ride identifier.' } }, required: ['rideId'] },
    },
  ],
  config_snippet: { mcpServers: { gotogether: { url: 'http://localhost:3001/mcp' } } },
  trust_config: [
    { tool: 'list_rides', name: 'List rides', minScore: 45 },
    { tool: 'create_ride', name: 'Create ride', minScore: 65 },
    { tool: 'delete_ride', name: 'Delete ride', minScore: 85 },
  ],
}

// ── Mock helpers ──────────────────────────────────────────────────────────────

function mockTrust(agentId, minScore = 65) {
  const score = agentId === 'untrusted-agent' ? 25 : 90
  const allow = score >= Number(minScore)
  return {
    allow,
    score,
    tier: allow ? 'AA' : 'D',
    riskLevel: allow ? 'low' : 'high',
    route: allow ? 'prod' : 'blocked',
    message: `Agent ${agentId} ${allow ? 'PASSED' : 'BLOCKED'} (score ${score}, tier ${allow ? 'AA' : 'D'})`,
  }
}

function mockChat(agentId, tools = []) {
  const minScore = tools.length ? Math.min(...tools.map((t) => t.trustThreshold || 65)) : 65
  const trust = mockTrust(agentId, minScore)
  if (!trust.allow) {
    return { reply: 'Blocked before execution. This agent does not meet the required Valiron trust threshold.', tool_calls: [], trust }
  }
  const tool = tools.find((t) => ['POST', 'PUT', 'PATCH'].includes(t.method)) || tools[0]
  return {
    reply: `${tool?.name || 'tool'} passed the Valiron trust gate and returned a demo result.`,
    tool_calls: tool ? [{ tool: tool.name, input: { origin: 'Hackathon venue', destination: 'Demo hall', seats: 3 } }] : [],
    trust,
  }
}

function buildGeneratedFromParsed(parsedApi) {
  const enabled = (parsedApi.actions || []).filter((a) => a.enabled !== false)
  return {
    ...MOCK_GENERATED,
    tools: enabled.map((a) => ({
      name: a.id,
      description: a.description,
      endpoint: a.path,
      method: a.method,
      trustThreshold: a.trustThreshold,
      input_schema: {
        type: 'object',
        properties: Object.fromEntries((a.parameters || []).map((p) => [p.name, { type: p.type, description: p.description }])),
        required: (a.parameters || []).filter((p) => p.required).map((p) => p.name),
      },
    })),
    trust_config: enabled.map((a) => ({ tool: a.id, name: a.name, minScore: a.trustThreshold })),
  }
}

// ── API functions (try real backend, fall back to mock on error) ──────────────

export function parseSpec(spec) {
  return post('/api/parse', { spec }, () => MOCK_PARSED)
}

export function generateConnector(parsedApi) {
  return post('/api/generate', { parsedApi }, () => buildGeneratedFromParsed(parsedApi || MOCK_PARSED))
}

export function sendChat(message, tools, baseUrl, apiKey, agentId) {
  return post('/api/chat', { message, tools, baseUrl, apiKey, agentId }, () => mockChat(agentId, tools))
}

export function checkTrust(agentId, minScore = 65) {
  return post('/api/trust-check', { agentId, minScore }, () => mockTrust(agentId, minScore))
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function post(path, body, fallback) {
  if (FORCE_MOCK) return fallback()
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
    return data
  } catch (e) {
    console.warn(`[api] ${path} failed, using mock fallback:`, e.message)
    return fallback()
  }
}
