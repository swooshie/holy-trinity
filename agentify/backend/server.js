const express = require("express");
const cors = require("cors");
const { parseSpec } = require("./src/parser");
const { generateServer } = require("./src/generator");
const { checkTrust } = require("./src/trust");
const { chatWithTools } = require("./src/chat");
const { fixtureParsedApi, fixtureGeneratedConnector } = require("./src/fixtures");

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function useFixtureMode(req) {
  return process.env.AGENTIFY_FIXTURE_MODE === "true" || req.body?.fixture === true;
}

function handleRoute(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      const status = error.statusCode || error.status || 500;
      res.status(status).json({
        error: error.message || "Unexpected backend error"
      });
    }
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "agentify-valiron-backend",
    trustGated: true,
    fixtureMode: process.env.AGENTIFY_FIXTURE_MODE === "true",
    trustMode: process.env.AGENTIFY_TRUST_MODE === "live" ? "live" : "deterministic",
    chatMode: process.env.AGENTIFY_CHAT_MODE === "live" && Boolean(process.env.ANTHROPIC_API_KEY) ? "live" : "deterministic",
    toolExecution: process.env.AGENTIFY_EXECUTE_TOOLS === "true" ? "live" : "mock"
  });
});

app.get("/api/demo-status", (_req, res) => {
  const trustMode = process.env.AGENTIFY_TRUST_MODE === "live" ? "live" : "deterministic";
  const chatMode = process.env.AGENTIFY_CHAT_MODE === "live" && Boolean(process.env.ANTHROPIC_API_KEY) ? "live" : "deterministic";

  res.json({
    ok: true,
    backend: "ready",
    apiBaseUrl: `http://localhost:${port}`,
    trustGated: true,
    fixtureMode: process.env.AGENTIFY_FIXTURE_MODE === "true",
    trustMode,
    chatMode,
    toolExecution: process.env.AGENTIFY_EXECUTE_TOOLS === "true" ? "live" : "mock",
    demoAgents: {
      trusted: process.env.DEMO_TRUSTED_AGENT_ID || "trusted-agent",
      untrusted: process.env.DEMO_UNTRUSTED_AGENT_ID || "untrusted-agent"
    },
    missingKeys: {
      valiron: trustMode === "live" && !process.env.VALIRON_API_KEY,
      anthropic: process.env.AGENTIFY_CHAT_MODE === "live" && !process.env.ANTHROPIC_API_KEY
    }
  });
});

app.post(
  "/api/parse",
  handleRoute(async (req) => {
    if (useFixtureMode(req)) {
      return fixtureParsedApi;
    }

    const spec = req.body?.spec ?? req.body;
    return parseSpec(spec);
  })
);

app.post(
  "/api/generate",
  handleRoute(async (req) => {
    if (useFixtureMode(req)) {
      return fixtureGeneratedConnector;
    }

    const parsedApi = req.body?.parsedApi || req.body?.parsed || req.body;
    const apiKey = req.body?.apiKey || process.env.TARGET_API_KEY;
    return generateServer(parsedApi, apiKey);
  })
);

app.post(
  "/api/trust-check",
  handleRoute(async (req) => {
    const { agentId, minScore } = req.body || {};
    return checkTrust(agentId, minScore);
  })
);

app.post(
  "/api/chat",
  handleRoute(async (req) => {
    const { message, tools, baseUrl, apiKey, agentId } = req.body || {};
    return chatWithTools({
      message,
      tools,
      baseUrl,
      apiKey,
      agentId
    });
  })
);

app.listen(port, () => {
  console.log(`Agentify + Valiron backend listening on http://localhost:${port}`);
});
