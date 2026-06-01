const assert = require("node:assert/strict");
const test = require("node:test");
const spec = require("../../specs/gotogether.openapi.json");
const { parseSpec } = require("../src/parser");
const { generateServer } = require("../src/generator");

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
