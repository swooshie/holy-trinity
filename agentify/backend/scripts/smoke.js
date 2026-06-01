const spec = require("../../specs/gotogether.openapi.json");

const baseUrl = process.env.AGENTIFY_API_BASE_URL || "http://127.0.0.1:3001";

async function main() {
  const status = await request("GET", "/api/demo-status");
  assert(status.ok, "demo status should be ok");

  const parsed = await request("POST", "/api/parse", { spec });
  assert(parsed.api_name === "GoTogether", "parse should return GoTogether");
  assert(parsed.actions?.length === 3, "parse should return three actions");

  const generated = await request("POST", "/api/generate", { parsedApi: parsed });
  assert(generated.tools?.length === 3, "generate should return three tools");

  const trusted = await request("POST", "/api/trust-check", {
    agentId: "trusted-agent",
    minScore: 65
  });
  assert(trusted.allow === true, "trusted-agent should pass");

  const untrusted = await request("POST", "/api/chat", {
    agentId: "untrusted-agent",
    message: "Create a ride",
    tools: generated.tools,
    baseUrl: parsed.base_url
  });
  assert(untrusted.trust?.allow === false, "untrusted-agent chat should block");

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: {
          trustMode: status.trustMode,
          chatMode: status.chatMode,
          toolExecution: status.toolExecution
        },
        actions: parsed.actions.map((action) => [action.id, action.trustThreshold]),
        generatedTools: generated.tools.length,
        blockedMessage: untrusted.trust.message
      },
      null,
      2
    )
  );
}

async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${data.error || response.status}`);
  }
  return data;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
