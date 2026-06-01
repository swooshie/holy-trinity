import assert from "node:assert/strict";
import test from "node:test";
import { checkTrust } from "../src/trust.js";

test("checkTrust allows deterministic trusted agent", async () => {
  const trust = await checkTrust("25459", 65);

  assert.equal(trust.allow, true);
  assert.equal(trust.score, 85);
  assert.equal(trust.route, "stub");
});

test("checkTrust blocks deterministic untrusted agent", async () => {
  const trust = await checkTrust("untrusted-agent", 65);

  assert.equal(trust.allow, false);
  assert.equal(trust.route, "stub");
});

test("checkTrust blocks missing agent id", async () => {
  const trust = await checkTrust("", 65);

  assert.equal(trust.allow, false);
  assert.equal(trust.riskLevel, "high");
});
