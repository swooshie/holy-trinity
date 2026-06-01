const { checkTrust } = require("./trust");

async function chatWithTools({ message, tools = [], baseUrl = "", apiKey = "", agentId }) {
  const availableTools = Array.isArray(tools) ? tools : [];
  const lowestThreshold = availableTools.reduce(
    (lowest, tool) => Math.min(lowest, Number(tool.trustThreshold || 65)),
    availableTools.length ? 100 : 65
  );
  const preflightTrust = await checkTrust(agentId, lowestThreshold);

  if (!preflightTrust.allow) {
    return {
      reply: "Blocked before execution. This agent does not meet the minimum Valiron trust threshold.",
      tool_calls: [],
      trust: preflightTrust
    };
  }

  const selectedTool = selectTool(message, availableTools);
  if (!selectedTool) {
    return {
      reply: "No matching tool was selected. Trust pre-flight passed.",
      tool_calls: [],
      trust: preflightTrust
    };
  }

  const toolTrust = await checkTrust(agentId, selectedTool.trustThreshold || 65);
  if (!toolTrust.allow) {
    return {
      reply: `Blocked before calling ${selectedTool.name}. This tool requires trust score ${selectedTool.trustThreshold}.`,
      tool_calls: [],
      trust: toolTrust
    };
  }

  const input = mockInputForTool(selectedTool);
  const execution = await executeOrMockTool(selectedTool, input, baseUrl, apiKey);

  return {
    reply: `${selectedTool.name} passed the Valiron trust gate and ${execution.mocked ? "returned a demo result" : "executed successfully"}.`,
    tool_calls: [
      {
        tool: selectedTool.name,
        input
      }
    ],
    trust: toolTrust,
    result: execution.result
  };
}

function selectTool(message = "", tools) {
  if (!tools.length) {
    return null;
  }

  const lowerMessage = message.toLowerCase();
  const destructive = tools.find((tool) => tool.method === "DELETE");
  const creator = tools.find((tool) => ["POST", "PUT", "PATCH"].includes(tool.method));
  const reader = tools.find((tool) => tool.method === "GET");

  if ((lowerMessage.includes("delete") || lowerMessage.includes("remove")) && destructive) {
    return destructive;
  }

  if ((lowerMessage.includes("create") || lowerMessage.includes("add") || lowerMessage.includes("book")) && creator) {
    return creator;
  }

  return reader || creator || destructive || tools[0];
}

function mockInputForTool(tool) {
  const input = {};
  for (const [name, schema] of Object.entries(tool.input_schema?.properties || {})) {
    if (schema.type === "number" || schema.type === "integer") {
      input[name] = 1;
    } else if (schema.type === "boolean") {
      input[name] = true;
    } else {
      input[name] = sampleValue(name);
    }
  }
  return input;
}

function sampleValue(name) {
  const lower = name.toLowerCase();
  if (lower.includes("id")) {
    return "demo-id";
  }
  if (lower.includes("origin")) {
    return "Hackathon venue";
  }
  if (lower.includes("destination")) {
    return "Demo hall";
  }
  if (lower.includes("city")) {
    return "San Francisco";
  }
  if (lower.includes("title")) {
    return "ship demo";
  }
  return "demo value";
}

async function executeOrMockTool(tool, input, baseUrl, apiKey) {
  if (!baseUrl || process.env.AGENTIFY_EXECUTE_TOOLS !== "true") {
    return {
      mocked: true,
      result: {
        ok: true,
        tool: tool.name,
        input
      }
    };
  }

  const url = new URL(tool.endpoint.replace(/\{([^}]+)\}/g, (_, name) => encodeURIComponent(input[name] || "")), baseUrl);
  const response = await fetch(url, {
    method: tool.method,
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
    },
    body: ["GET", "DELETE"].includes(tool.method) ? undefined : JSON.stringify(input)
  });
  const text = await response.text();
  return {
    mocked: false,
    result: {
      status: response.status,
      body: parseMaybeJson(text)
    }
  };
}

function parseMaybeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

module.exports = {
  chatWithTools
};
