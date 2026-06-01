const assert = require("node:assert/strict");
const test = require("node:test");
const { checkTrust } = require("../src/trust");

test("checkTrust allows deterministic trusted agent", async () => {
  const trust = await checkTrust("trusted-agent", 65);

  assert.equal(trust.allow, true);
  assert.equal(trust.score, 90);
  assert.equal(trust.route, "prod");
});

test("checkTrust blocks deterministic untrusted agent", async () => {
  const trust = await checkTrust("untrusted-agent", 65);

  assert.equal(trust.allow, false);
  assert.equal(trust.route, "blocked");
});

test("checkTrust blocks missing agent id", async () => {
  const trust = await checkTrust("", 65);

  assert.equal(trust.allow, false);
  assert.equal(trust.riskLevel, "high");
});
