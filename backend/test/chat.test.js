import assert from "node:assert/strict";
import test from "node:test";
import { chatWithTools } from "../src/chat.js";

const tools = [
  {
    name: "list_rides",
    description: "List rides.",
    endpoint: "/rides",
    method: "GET",
    trustThreshold: 45,
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string" }
      },
      required: []
    }
  },
  {
    name: "create_ride",
    description: "Create ride.",
    endpoint: "/rides",
    method: "POST",
    trustThreshold: 65,
    input_schema: {
      type: "object",
      properties: {
        origin: { type: "string" },
        seats: { type: "number" }
      },
      required: ["origin"]
    }
  }
];

test("chatWithTools blocks untrusted agents before execution", async () => {
  const result = await chatWithTools("Create a ride", tools, "https://api.gotogether.example.com", null, "untrusted-agent");

  assert.equal(result.trust.allow, false);
  assert.deepEqual(result.tool_calls, []);
});

test("chatWithTools returns a mocked tool call for trusted agents in fallback mode", async () => {
  const result = await chatWithTools("Create a ride", tools, "https://api.gotogether.example.com", null, "25459");

  assert.equal(result.trust.allow, true);
  assert.equal(result.tool_calls.length, 1);
  assert.equal(result.tool_calls[0].blocked, false);
});
