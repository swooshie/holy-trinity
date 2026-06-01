import { mockGenerated, mockParsedApi } from "./fixtures";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const FORCE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

async function post(path, body, fallback) {
  if (FORCE_MOCKS) {
    return fallback();
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  } catch (error) {
    console.warn(`Falling back to mock for ${path}:`, error.message);
    return fallback();
  }
}

async function get(path, fallback) {
  if (FORCE_MOCKS) {
    return fallback();
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  } catch (error) {
    console.warn(`Falling back to mock for ${path}:`, error.message);
    return fallback();
  }
}

export function getDemoStatus() {
  return get("/api/demo-status", () => ({
    ok: true,
    backend: FORCE_MOCKS ? "mocked" : "offline-mock",
    apiBaseUrl: API_BASE_URL,
    trustGated: true,
    fixtureMode: FORCE_MOCKS,
    trustMode: "deterministic",
    chatMode: "deterministic",
    toolExecution: "mock",
    demoAgents: {
      trusted: "trusted-agent",
      untrusted: "untrusted-agent"
    },
    missingKeys: {
      valiron: false,
      anthropic: false
    }
  }));
}

export function parseSpec(spec) {
  return post("/api/parse", { spec }, () => mockParsedApi);
}

export function generateConnector(parsedApi) {
  return post("/api/generate", { parsedApi }, () => buildGeneratedFromParsed(parsedApi || mockParsedApi));
}

export function trustCheck(agentId, minScore) {
  return post("/api/trust-check", { agentId, minScore }, () => mockTrust(agentId, minScore));
}

export function chatWithTools({ message, tools, baseUrl, apiKey, agentId }) {
  return post("/api/chat", { message, tools, baseUrl, apiKey, agentId }, () => mockChat(agentId, tools));
}

function buildGeneratedFromParsed(parsedApi) {
  const enabledActions = (parsedApi.actions || []).filter((action) => action.enabled !== false);
  return {
    ...mockGenerated,
    tools: enabledActions.map((action) => ({
      name: action.id,
      description: action.description,
      endpoint: action.path,
      method: action.method,
      trustThreshold: action.trustThreshold,
      input_schema: {
        type: "object",
        properties: Object.fromEntries((action.parameters || []).map((parameter) => [parameter.name, { type: parameter.type, description: parameter.description }])),
        required: (action.parameters || []).filter((parameter) => parameter.required).map((parameter) => parameter.name)
      }
    })),
    trust_config: enabledActions.map((action) => ({
      tool: action.id,
      name: action.name,
      minScore: action.trustThreshold
    }))
  };
}

function mockTrust(agentId, minScore = 65) {
  const score = agentId === "untrusted-agent" ? 25 : 90;
  const allow = score >= minScore;
  return {
    allow,
    score,
    tier: allow ? "AA" : "D",
    riskLevel: allow ? "low" : "high",
    route: allow ? "prod" : "blocked",
    message: `Agent ${agentId} ${allow ? "PASSED" : "BLOCKED"} (score ${score}, tier ${allow ? "AA" : "D"})`
  };
}

function mockChat(agentId, tools = []) {
  const minScore = Math.min(...tools.map((tool) => tool.trustThreshold || 65), 65);
  const trust = mockTrust(agentId, minScore);
  if (!trust.allow) {
    return {
      reply: "Blocked before execution. This agent does not meet the required Valiron trust threshold.",
      tool_calls: [],
      trust
    };
  }

  const tool = tools.find((item) => ["POST", "PUT", "PATCH"].includes(item.method)) || tools[0];
  return {
    reply: `${tool?.name || "tool"} passed the Valiron trust gate and returned a demo result.`,
    tool_calls: tool ? [{ tool: tool.name, input: { demo: true } }] : [],
    trust
  };
}
