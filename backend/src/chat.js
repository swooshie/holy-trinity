import { checkTrust } from "./trust.js";

function buildApiUrl(baseUrl, endpoint, input) {
  let path = endpoint;

  const pathMatches = endpoint.match(/\{([^}]+)\}/g) || [];
  for (const match of pathMatches) {
    const key = match.slice(1, -1);
    const value = input?.[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    path = path.replace(match, encodeURIComponent(String(value)));
  }

  return `${String(baseUrl || "").replace(/\/$/, "")}${path}`;
}

function splitPayload(input, endpoint) {
  const payload = { ...(input || {}) };
  const pathMatches = endpoint.match(/\{([^}]+)\}/g) || [];

  for (const match of pathMatches) {
    const key = match.slice(1, -1);
    delete payload[key];
  }

  return payload;
}

async function callToolApi(tool, input, baseUrl, apiKey, agentId) {
  const method = String(tool.method || "GET").toUpperCase();
  const endpoint = tool.endpoint || tool.path;

  if (!endpoint) {
    throw new Error(`Tool ${tool.name} is missing endpoint/path`);
  }

  const url = new URL(buildApiUrl(baseUrl, endpoint, input));
  const payload = splitPayload(input, endpoint);

  const headers = {
    "content-type": "application/json",
    "x-agent-id": String(agentId || "")
  };

  if (apiKey) {
    headers.authorization = `Bearer ${apiKey}`;
  }

  if (method === "GET" || method === "DELETE") {
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(payload)
  });

  const text = await response.text();
  let parsed = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Tool API call failed (${response.status}): ${text}`);
  }

  return parsed;
}

function chooseTools(tools, message) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return [];
  }

  if (!message) {
    return [tools[0]];
  }

  const normalized = String(message).toLowerCase();
  const matches = tools.filter((tool) => {
    const name = String(tool.name || "").toLowerCase();
    const description = String(tool.description || "").toLowerCase();
    return normalized.includes(name) || (description && normalized.includes(description.split(" ")[0] || ""));
  });

  return matches.length > 0 ? matches.slice(0, 2) : [tools[0]];
}

export async function chatWithTools(message, tools, baseUrl, apiKey, agentId) {
  const selectedTools = chooseTools(tools, message);
  const lowestThreshold = selectedTools.reduce(
    (minScore, tool) => Math.min(minScore, Number(tool.trustThreshold ?? 65)),
    100
  );

  const preflight = await checkTrust(agentId, lowestThreshold === 100 ? 65 : lowestThreshold);

  if (!preflight.allow) {
    return {
      reply: "Request blocked before execution because the selected agent is below trust requirements.",
      tool_calls: [],
      trust: preflight
    };
  }

  const toolCalls = [];

  for (const tool of selectedTools) {
    const threshold = Number(tool.trustThreshold ?? 65);
    const perToolTrust = await checkTrust(agentId, threshold);

    if (!perToolTrust.allow) {
      toolCalls.push({
        tool: tool.name,
        input: {},
        trust: perToolTrust,
        blocked: true,
        result: {
          error: "Blocked by trust threshold"
        }
      });
      continue;
    }

    const input = {};

    try {
      const result = await callToolApi(tool, input, baseUrl, apiKey, agentId);
      toolCalls.push({
        tool: tool.name,
        input,
        trust: perToolTrust,
        blocked: false,
        result
      });
    } catch (error) {
      toolCalls.push({
        tool: tool.name,
        input,
        trust: perToolTrust,
        blocked: false,
        result: {
          error: error?.message || "Unknown tool execution error"
        }
      });
    }
  }

  const blockedCount = toolCalls.filter((call) => call.blocked).length;
  const successCount = toolCalls.filter((call) => !call.blocked && !call.result?.error).length;

  let reply = "No tool was selected.";
  if (toolCalls.length > 0) {
    if (blockedCount > 0 && successCount === 0) {
      reply = "All selected tools were blocked by trust requirements.";
    } else if (blockedCount > 0) {
      reply = "Some tools executed successfully, and some were blocked by trust requirements.";
    } else {
      reply = "Selected tools executed successfully.";
    }
  }

  return {
    reply,
    tool_calls: toolCalls.map((call) => ({
      tool: call.tool,
      input: call.input,
      blocked: call.blocked
    })),
    trust: preflight,
    debug: {
      toolExecution: toolCalls
    }
  };
}
