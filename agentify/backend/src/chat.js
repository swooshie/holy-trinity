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

  if (shouldUseLiveChat()) {
    return chatWithClaude({
      message,
      tools: availableTools,
      baseUrl,
      apiKey,
      agentId,
      preflightTrust
    });
  }

  return chatWithDeterministicTool({
    message,
    tools: availableTools,
    baseUrl,
    apiKey,
    agentId,
    preflightTrust
  });
}

async function chatWithDeterministicTool({ message, tools, baseUrl, apiKey, agentId, preflightTrust }) {
  const selectedTool = selectTool(message, tools);
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

async function chatWithClaude({ message, tools, baseUrl, apiKey, agentId, preflightTrust }) {
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const claudeTools = tools.map(toClaudeTool);
    const firstResponse = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 800,
      system: "You are testing generated API tools. Use a tool only when the user request maps clearly to one of the available tools.",
      messages: [
        {
          role: "user",
          content: message || "Run the most relevant tool."
        }
      ],
      tools: claudeTools,
      tool_choice: { type: "auto" }
    });

    const toolUses = (firstResponse.content || []).filter((block) => block.type === "tool_use");
    if (!toolUses.length) {
      return {
        reply: extractText(firstResponse) || "Trust pre-flight passed. Claude did not select a tool.",
        tool_calls: [],
        trust: preflightTrust
      };
    }

    const toolResults = [];
    const toolCalls = [];
    let lastTrust = preflightTrust;

    for (const toolUse of toolUses) {
      const selectedTool = tools.find((tool) => tool.name === toolUse.name);
      if (!selectedTool) {
        continue;
      }

      const toolTrust = await checkTrust(agentId, selectedTool.trustThreshold || 65);
      lastTrust = toolTrust;
      if (!toolTrust.allow) {
        return {
          reply: `Blocked before calling ${selectedTool.name}. This tool requires trust score ${selectedTool.trustThreshold}.`,
          tool_calls: [],
          trust: toolTrust
        };
      }

      const input = toolUse.input || {};
      const execution = await executeOrMockTool(selectedTool, input, baseUrl, apiKey);
      toolCalls.push({
        tool: selectedTool.name,
        input
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(execution.result)
      });
    }

    if (!toolResults.length) {
      return {
        reply: "Claude selected a tool that is not in the generated connector metadata.",
        tool_calls: [],
        trust: preflightTrust
      };
    }

    const finalResponse = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: message || "Run the most relevant tool."
        },
        {
          role: "assistant",
          content: firstResponse.content
        },
        {
          role: "user",
          content: toolResults
        }
      ],
      tools: claudeTools
    });

    return {
      reply: extractText(finalResponse) || "Tool call completed after passing the Valiron trust gate.",
      tool_calls: toolCalls,
      trust: lastTrust
    };
  } catch (error) {
    if (process.env.AGENTIFY_CHAT_STRICT === "true") {
      throw error;
    }

    return chatWithDeterministicTool({
      message,
      tools,
      baseUrl,
      apiKey,
      agentId,
      preflightTrust
    });
  }
}

function shouldUseLiveChat() {
  return process.env.AGENTIFY_CHAT_MODE === "live" && Boolean(process.env.ANTHROPIC_API_KEY);
}

function toClaudeTool(tool) {
  return {
    name: tool.name,
    description: tool.description || `${tool.method} ${tool.endpoint}`,
    input_schema: tool.input_schema || {
      type: "object",
      properties: {},
      required: []
    }
  };
}

function extractText(response) {
  return (response.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
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
  chatWithTools,
  selectTool,
  mockInputForTool
};
