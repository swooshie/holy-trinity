import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { parseSpec } from "../src/parser.js";
import { generateServer } from "../src/generator.js";

const require = createRequire(import.meta.url);
const spec = require("../../specs/gotogether.openapi.json");

test("generateServer preserves edited thresholds and omits disabled actions", async () => {
  const parsed = await parseSpec(spec);
  parsed.actions = parsed.actions.map((action) => {
    if (action.id === "create_ride") {
      return { ...action, trustThreshold: 72 };
    }
    if (action.id === "delete_ride") {
      return { ...action, enabled: false };
    }
    return action;
  });

  const generated = generateServer(parsed);

  assert.deepEqual(
    generated.tools.map((tool) => [tool.name, tool.trustThreshold]),
    [
      ["list_rides", 45],
      ["create_ride", 72]
    ]
  );
  assert.equal(generated.server_code.includes("@valiron/sdk"), true);
  assert.equal(generated.server_code.includes("valiron.gate(agentId, { minScore })"), true);
  assert.equal(generated.server_code.includes("registerTool"), true);
});
