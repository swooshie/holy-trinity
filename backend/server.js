import express from "express";
import cors from "cors";

import { parsedFixture, generatedFixture } from "./src/fixtures.js";
import { checkTrust } from "./src/trust.js";
import { chatWithTools } from "./src/chat.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function isTruthy(value) {
  return value === "1" || value === "true" || value === "yes";
}

function fallbackMode() {
  return isTruthy((process.env.DEMO_FALLBACK_MODE || "true").toLowerCase());
}

async function maybeParseSpec(spec) {
  if (fallbackMode()) {
    return parsedFixture;
  }

  try {
    const parserModule = await import("./src/parser.js");
    if (typeof parserModule.parseSpec !== "function") {
      throw new Error("parseSpec export was not found in src/parser.js");
    }
    return await parserModule.parseSpec(spec);
  } catch (error) {
    throw new Error(`parseSpec unavailable: ${error?.message || "Unknown error"}`);
  }
}

async function maybeGenerateServer(parsed, apiKey) {
  if (fallbackMode()) {
    return generatedFixture;
  }

  try {
    const generatorModule = await import("./src/generator.js");
    if (typeof generatorModule.generateServer !== "function") {
      throw new Error("generateServer export was not found in src/generator.js");
    }
    return await generatorModule.generateServer(parsed, apiKey);
  } catch (error) {
    throw new Error(`generateServer unavailable: ${error?.message || "Unknown error"}`);
  }
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "agentify-valiron-backend",
    fallbackMode: fallbackMode(),
    trustGated: true
  });
});

app.post("/api/parse", async (req, res) => {
  try {
    const { spec } = req.body || {};
    const parsed = await maybeParseSpec(spec);
    res.json(parsed);
  } catch (error) {
    res.status(400).json({ error: error?.message || "Failed to parse spec" });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const { parsedApi, apiKey } = req.body || {};
    const generated = await maybeGenerateServer(parsedApi, apiKey);
    res.json(generated);
  } catch (error) {
    res.status(400).json({ error: error?.message || "Failed to generate connector" });
  }
});

app.post("/api/trust-check", async (req, res) => {
  try {
    const { agentId, minScore = 65 } = req.body || {};
    const trust = await checkTrust(agentId, minScore);
    res.json(trust);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Trust check failed" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, tools = generatedFixture.tools, baseUrl, apiKey, agentId } = req.body || {};
    const chat = await chatWithTools(message, tools, baseUrl, apiKey, agentId);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Chat proxy failed" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
