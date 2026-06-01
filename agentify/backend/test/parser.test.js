const assert = require("node:assert/strict");
const test = require("node:test");
const spec = require("../../specs/gotogether.openapi.json");
const { parseSpec } = require("../src/parser");

test("parseSpec extracts stable actions and default trust thresholds", async () => {
  const parsed = await parseSpec(spec);

  assert.equal(parsed.api_name, "GoTogether");
  assert.equal(parsed.base_url, "https://api.gotogether.example.com");
  assert.deepEqual(
    parsed.actions.map((action) => ({
      id: action.id,
      method: action.method,
      trustThreshold: action.trustThreshold
    })),
    [
      { id: "list_rides", method: "GET", trustThreshold: 45 },
      { id: "create_ride", method: "POST", trustThreshold: 65 },
      { id: "delete_ride", method: "DELETE", trustThreshold: 85 }
    ]
  );
});

test("parseSpec accepts a JSON string", async () => {
  const parsed = await parseSpec(JSON.stringify(spec));

  assert.equal(parsed.actions.length, 3);
});
