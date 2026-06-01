const assert = require("node:assert/strict");
const test = require("node:test");
const { chatWithTools, selectTool } = require("../src/chat");

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

test("selectTool chooses write tools for create requests", () => {
  assert.equal(selectTool("Create a ride", tools).name, "create_ride");
});

test("chatWithTools blocks untrusted agents before execution", async () => {
  const result = await chatWithTools({
    message: "Create a ride",
    tools,
    agentId: "untrusted-agent"
  });

  assert.equal(result.trust.allow, false);
  assert.deepEqual(result.tool_calls, []);
});

test("chatWithTools returns a tool call for trusted agents", async () => {
  const result = await chatWithTools({
    message: "Create a ride",
    tools,
    agentId: "trusted-agent"
  });

  assert.equal(result.trust.allow, true);
  assert.equal(result.tool_calls[0].tool, "create_ride");
});
