import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { parseSpec } from "../src/parser.js";

const require = createRequire(import.meta.url);
const spec = require("../../specs/gotogether.openapi.json");

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
