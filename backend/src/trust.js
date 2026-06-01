import { TRUSTED_AGENT_IDS as fixtureTrustedAgentIds } from "./fixtures.js";

let cachedValiron = null;

function isTruthy(value) {
  return value === "1" || value === "true" || value === "yes";
}

function getFallbackMode() {
  return isTruthy((process.env.DEMO_FALLBACK_MODE || "true").toLowerCase());
}

function getTrustedAgentIds() {
  const fromEnv = (process.env.TRUSTED_AGENT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return new Set(fromEnv);
  }

  return new Set(fixtureTrustedAgentIds);
}

function formatTrustResult({ allow, score, tier, riskLevel, route, agentId, minScore, message }) {
  return {
    allow,
    score,
    tier,
    riskLevel,
    route,
    message:
      message ||
      (allow
        ? `Agent ${agentId} PASSED (score ${score}, tier ${tier}, min ${minScore})`
        : `Agent ${agentId} BLOCKED (score ${score}, tier ${tier}, min ${minScore})`)
  };
}

function getStubResult(agentId, minScore) {
  const trusted = getTrustedAgentIds().has(String(agentId));

  if (trusted) {
    return formatTrustResult({
      allow: true,
      score: Math.max(85, minScore + 5),
      tier: "AA",
      riskLevel: "low",
      route: "stub",
      agentId,
      minScore
    });
  }

  return formatTrustResult({
    allow: false,
    score: Math.min(40, Math.max(0, minScore - 20)),
    tier: "C",
    riskLevel: "high",
    route: "stub",
    agentId,
    minScore
  });
}

function normalizeRiskLevel(riskLevel) {
  if (!riskLevel) {
    return "unknown";
  }

  const normalized = String(riskLevel).toLowerCase();
  if (normalized === "green") {
    return "low";
  }
  if (normalized === "yellow") {
    return "medium";
  }
  if (normalized === "red") {
    return "high";
  }
  return normalized;
}

function allowFromRoute(route) {
  const normalized = String(route || "").toLowerCase();
  return normalized === "prod" || normalized === "prod_throttled";
}

async function getValironClient() {
  if (cachedValiron) {
    return cachedValiron;
  }

  try {
    const mod = await import("@valiron/sdk");
    const ValironCtor = mod.ValironSDK || mod.default || mod;
    const apiKey = process.env.VALIRON_API_KEY;
    const options = apiKey ? { apiKey } : undefined;
    cachedValiron = options ? new ValironCtor(options) : new ValironCtor();
    return cachedValiron;
  } catch (error) {
    return null;
  }
}

export async function checkTrust(agentId, minScore = 65) {
  if (!agentId) {
    return formatTrustResult({
      allow: false,
      score: 0,
      tier: "unknown",
      riskLevel: "high",
      route: "local",
      agentId: "missing",
      minScore,
      message: "Missing agentId. Request blocked."
    });
  }

  if (getFallbackMode()) {
    return getStubResult(String(agentId), Number(minScore));
  }

  const valiron = await getValironClient();
  if (!valiron) {
    return formatTrustResult({
      allow: false,
      score: 0,
      tier: "unknown",
      riskLevel: "high",
      route: "local",
      agentId,
      minScore,
      message: "Valiron SDK unavailable. Request blocked."
    });
  }

  const hasGate = typeof valiron.gate === "function";
  const hasProfile = typeof valiron.getAgentProfile === "function";
  const hasRouteCheck = typeof valiron.checkAgent === "function";

  if (!hasGate && !hasProfile && !hasRouteCheck) {
    return formatTrustResult({
      allow: false,
      score: 0,
      tier: "unknown",
      riskLevel: "high",
      route: "local",
      agentId,
      minScore,
      message: "Valiron SDK missing gate/profile methods. Request blocked."
    });
  }

  try {
    if (hasGate) {
      const gate = await valiron.gate(String(agentId), { minScore: Number(minScore) });
      return formatTrustResult({
        allow: Boolean(gate?.allow),
        score: Number(gate?.score ?? 0),
        tier: String(gate?.tier ?? "unknown"),
        riskLevel: normalizeRiskLevel(gate?.riskLevel),
        route: String(gate?.route ?? "valiron"),
        agentId,
        minScore,
        message: gate?.message
      });
    }

    let profile = null;
    if (hasProfile) {
      profile = await valiron.getAgentProfile(String(agentId));
    }

    const route =
      profile?.routing?.finalRoute ||
      profile?.routing?.route ||
      (hasRouteCheck ? await valiron.checkAgent(String(agentId)) : "unknown");

    const score = Number(
      profile?.localReputation?.score ??
        profile?.onchainReputation?.averageScore ??
        0
    );
    const tier = String(profile?.localReputation?.tier ?? "unknown");
    const riskLevel = normalizeRiskLevel(profile?.localReputation?.riskLevel);

    const allow = allowFromRoute(route) && score >= Number(minScore);

    return formatTrustResult({
      allow,
      score,
      tier,
      riskLevel,
      route: String(route || "unknown"),
      agentId,
      minScore,
      message: profile?.routing?.decision || profile?.routing?.reasons?.[0]
    });
  } catch (error) {
    return formatTrustResult({
      allow: false,
      score: 0,
      tier: "unknown",
      riskLevel: "high",
      route: "error",
      agentId,
      minScore,
      message: `Valiron error: ${error?.message || "Unknown error"}`
    });
  }
}
