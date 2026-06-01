import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stableActionId } from "./parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateServer(parsedApi, apiKey) {
  if (!parsedApi?.actions?.length) {
    throw Object.assign(new Error("Parsed API with actions is required"), { statusCode: 400 });
  }

  const serverName = stableActionId(parsedApi.api_name || "generated_api") || "generated_api";
  const enabledActions = parsedApi.actions.filter((action) => action.enabled !== false);
  const tools = enabledActions.map(actionToTool);
  const trustConfig = enabledActions.map((action) => ({
    tool: action.id,
    name: action.name,
    minScore: Number(action.trustThreshold || 65)
  }));
  const serverCode = buildServerCode({
    serverName,
    parsedApi,
    actions: enabledActions,
    apiKey
  });

  const generatedRoot = path.join(__dirname, "..", "generated", serverName);
  fs.mkdirSync(generatedRoot, { recursive: true });
  fs.writeFileSync(path.join(generatedRoot, "server.js"), serverCode);
  fs.writeFileSync(path.join(generatedRoot, "tools.json"), JSON.stringify(tools, null, 2));
  fs.writeFileSync(path.join(generatedRoot, "package.json"), JSON.stringify(generatedPackage(serverName), null, 2));

  return {
    server_dir: `backend/generated/${serverName}`,
    server_code: serverCode,
    tools,
    config_snippet: {
      mcpServers: {
        [serverName]: {
          url: "http://localhost:3001/mcp"
        }
      }
    },
    trust_config: trustConfig
  };
}

export function actionToTool(action) {
  const properties = {};
  const required = [];

  for (const parameter of action.parameters || []) {
    properties[parameter.name] = {
      type: parameter.type || "string",
      description: parameter.description || ""
    };

    if (parameter.required) {
      required.push(parameter.name);
    }
  }

  return {
    name: action.id,
    description: action.description || action.name,
    endpoint: action.path,
    method: action.method,
    trustThreshold: Number(action.trustThreshold || 65),
    input_schema: {
      type: "object",
      properties,
      required
    }
  };
}

function generatedPackage(serverName) {
  return {
    name: `agentify-${serverName}-connector`,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      start: "node server.js"
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^1.6.0",
      "@valiron/sdk": "^0.4.0",
      express: "^4.21.2",
      zod: "^3.23.8"
    }
  };
}

function buildServerCode({ serverName, parsedApi, actions, apiKey }) {
  const actionJson = JSON.stringify(actions, null, 2);
  const baseUrl = JSON.stringify(parsedApi.base_url || "");
  const embeddedApiKey = apiKey ? JSON.stringify(apiKey) : "process.env.TARGET_API_KEY";

  return `import express from "express";
import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ValironSDK } from "@valiron/sdk";

const app = express();
const port = Number(process.env.PORT || 3001);
const apiBaseUrl = process.env.API_BASE_URL || ${baseUrl};
const targetApiKey = ${embeddedApiKey};
const defaultAgentId = process.env.DEFAULT_AGENT_ID;
const valiron = new ValironSDK({ apiKey: process.env.VALIRON_API_KEY });
const actions = ${actionJson};

app.use(express.json());

const server = new McpServer({
  name: ${JSON.stringify(serverName)},
  version: "0.1.0"
});

for (const action of actions) {
  server.registerTool(action.id, {
    title: action.name,
    description: action.description || action.name,
    inputSchema: buildInputSchema(action)
  }, async (input, extra) => {
    const agentId = extra?.headers?.["x-agent-id"] || extra?.headers?.["X-Agent-Id"] || defaultAgentId;
    const minScore = Number(action.trustThreshold || 65);

    if (!agentId) {
      return blockedResult("Missing x-agent-id header.", { minScore });
    }

    const gate = await valiron.gate(agentId, { minScore });
    if (!gate.allow) {
      return blockedResult(\`Agent \${agentId} failed Valiron trust gate.\`, {
        minScore,
        score: gate.score,
        tier: gate.tier,
        riskLevel: gate.riskLevel,
        route: gate.route
      });
    }

    const result = await executeAction(action, input || {});
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ok: true, trust: gate, result }, null, 2)
        }
      ]
    };
  });
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    connector: ${JSON.stringify(serverName)},
    trustGated: true,
    tools: actions.map((action) => ({
      name: action.id,
      method: action.method,
      path: action.path,
      trustThreshold: action.trustThreshold
    }))
  });
});

app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(port, () => {
  console.log(\`Trust-gated MCP connector listening on http://localhost:\${port}\`);
});

function buildInputSchema(action) {
  const shape = {};
  for (const parameter of action.parameters || []) {
    let schema;
    if (parameter.type === "number" || parameter.type === "integer") {
      schema = z.number();
    } else if (parameter.type === "boolean") {
      schema = z.boolean();
    } else if (parameter.type === "array") {
      schema = z.array(z.unknown());
    } else if (parameter.type === "object") {
      schema = z.record(z.string(), z.unknown());
    } else {
      schema = z.string();
    }
    if (parameter.description) {
      schema = schema.describe(parameter.description);
    }
    if (!parameter.required) {
      schema = schema.optional();
    }
    shape[parameter.name] = schema;
  }
  return shape;
}

function blockedResult(message, details = {}) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ ok: false, blocked: true, message, ...details }, null, 2)
      }
    ]
  };
}

async function executeAction(action, input) {
  const url = new URL(action.path.replace(/\\{([^}]+)\\}/g, (_, name) => encodeURIComponent(input[name] || "")), apiBaseUrl);
  const body = {};
  for (const parameter of action.parameters || []) {
    if (parameter.in === "query" && input[parameter.name] !== undefined) {
      url.searchParams.set(parameter.name, input[parameter.name]);
    }
    if (parameter.in === "body" && input[parameter.name] !== undefined) {
      body[parameter.name] = input[parameter.name];
    }
  }

  const response = await fetch(url, {
    method: action.method,
    headers: {
      "content-type": "application/json",
      ...(targetApiKey ? { authorization: \`Bearer \${targetApiKey}\` } : {})
    },
    body: ["GET", "DELETE"].includes(action.method) ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: response.status, body: text };
  }
}
`;
}
