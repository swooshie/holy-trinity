const TRUSTED_IDS = new Set(["trusted-agent", "25459", "demo-trusted", "valiron-trusted"]);
const UNTRUSTED_IDS = new Set(["untrusted-agent", "00000", "demo-untrusted", "valiron-untrusted"]);

async function checkTrust(agentId, minScore = 65) {
  const requiredScore = Number(minScore ?? 65);

  if (!agentId) {
    return blocked("unknown", 0, "Missing agent ID.", requiredScore);
  }

  if (process.env.VALIRON_API_KEY && process.env.AGENTIFY_TRUST_MODE === "live") {
    return checkLiveTrust(agentId, requiredScore);
  }

  if (UNTRUSTED_IDS.has(agentId)) {
    return blocked(agentId, 25, `Agent ${agentId} BLOCKED (score 25, tier D)`, requiredScore);
  }

  const score = TRUSTED_IDS.has(agentId) ? 90 : 70;
  return {
    allow: score >= requiredScore,
    score,
    tier: score >= 85 ? "AA" : "A",
    riskLevel: score >= requiredScore ? "low" : "medium",
    route: score >= requiredScore ? "prod" : "blocked",
    message:
      score >= requiredScore
        ? `Agent ${agentId} PASSED (score ${score}, tier ${score >= 85 ? "AA" : "A"})`
        : `Agent ${agentId} BLOCKED (score ${score}, tier ${score >= 85 ? "AA" : "A"})`
  };
}

async function checkLiveTrust(agentId, minScore) {
  try {
    const { ValironSDK } = require("@valiron/sdk");
    const valiron = new ValironSDK({ apiKey: process.env.VALIRON_API_KEY });
    const gate = await valiron.gate(agentId, { minScore });
    return {
      allow: Boolean(gate.allow),
      score: Number(gate.score || 0),
      tier: gate.tier || "unknown",
      riskLevel: gate.riskLevel || (gate.allow ? "low" : "high"),
      route: gate.route || (gate.allow ? "prod" : "blocked"),
      message: `Agent ${agentId} ${gate.allow ? "PASSED" : "BLOCKED"} (score ${gate.score ?? "unknown"}, tier ${gate.tier ?? "unknown"})`
    };
  } catch (error) {
    return blocked(agentId, 0, `Valiron trust check failed: ${error.message}`, minScore, true);
  }
}

function blocked(agentId, score, message, minScore, sdkError = false) {
  return {
    allow: false,
    score,
    tier: score > 0 ? "D" : "unknown",
    riskLevel: "high",
    route: "blocked",
    message,
    minScore,
    sdkError
  };
}

module.exports = {
  checkTrust
};
