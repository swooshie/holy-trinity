import { useState } from "react";
import { MessageSquareText, ShieldAlert, ShieldCheck } from "lucide-react";
import { chatWithTools } from "../api";

export function TryItScreen({ generated, parsedApi, chatResult, setChatResult, demoStatus, next, previous }) {
  const defaultTrustedAgent = demoStatus?.demoAgents?.trusted || "trusted-agent";
  const defaultUntrustedAgent = demoStatus?.demoAgents?.untrusted || "untrusted-agent";
  const [agentId, setAgentId] = useState(defaultTrustedAgent);
  const [message, setMessage] = useState("Create a ride from the hackathon venue to the demo hall.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runtimeAgents = [
    { label: "Trusted", id: defaultTrustedAgent },
    { label: "Untrusted", id: defaultUntrustedAgent }
  ];

  async function handleSend() {
    setLoading(true);
    setError("");
    try {
      const result = await chatWithTools({
        message,
        tools: generated?.tools || [],
        baseUrl: parsedApi?.base_url,
        agentId
      });
      setChatResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const passed = chatResult?.trust?.allow;

  return (
    <div>
      <div className="screen-heading">
        <div>
          <h2>Try connector</h2>
          <p className="muted">Run the same request as different agents to show Valiron gating.</p>
        </div>
        <div className="button-row">
          <button className="secondary-button" onClick={previous}>Back</button>
          <button className="primary-button" onClick={next}>Take home</button>
        </div>
      </div>

      <div className="try-grid">
        <div className="panel">
          <div className="segmented">
            {runtimeAgents.map((agent) => (
              <button key={agent.id} className={agentId === agent.id ? "selected" : ""} onClick={() => setAgentId(agent.id)}>
                {agent.label}
              </button>
            ))}
          </div>
          <div className="agent-id">{agentId}</div>
          <input className="chat-input" value={message} onChange={(event) => setMessage(event.target.value)} />
          {error && <div className="error">{error}</div>}
          <button className="primary-button" onClick={handleSend} disabled={loading}>
            <MessageSquareText size={18} />
            {loading ? "Checking trust" : "Send request"}
          </button>
        </div>

        <div className={`trust-card ${chatResult ? (passed ? "pass" : "block") : ""}`}>
          {chatResult ? (
            <>
              {passed ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
              <h3>{passed ? "Trust passed" : "Trust blocked"}</h3>
              <p>{chatResult.trust.message}</p>
              <p className="score">Score {chatResult.trust.score} · {chatResult.trust.route}</p>
              <div className="reply">{chatResult.reply}</div>
              {!!chatResult.tool_calls?.length && (
                <pre>{JSON.stringify(chatResult.tool_calls, null, 2)}</pre>
              )}
            </>
          ) : (
            <p className="muted">No request sent yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
