import { useState } from "react";
import { MessageSquareText, ShieldAlert, ShieldCheck } from "lucide-react";
import { chatWithTools } from "../api";

const agents = [
  { label: "Trusted", id: "trusted-agent" },
  { label: "Untrusted", id: "untrusted-agent" }
];

export function TryItScreen({ generated, parsedApi, chatResult, setChatResult, next, previous }) {
  const [agentId, setAgentId] = useState("trusted-agent");
  const [message, setMessage] = useState("Create a ride from the hackathon venue to the demo hall.");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const result = await chatWithTools({
        message,
        tools: generated?.tools || [],
        baseUrl: parsedApi?.base_url,
        agentId
      });
      setChatResult(result);
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
            {agents.map((agent) => (
              <button key={agent.id} className={agentId === agent.id ? "selected" : ""} onClick={() => setAgentId(agent.id)}>
                {agent.label}
              </button>
            ))}
          </div>
          <input className="chat-input" value={message} onChange={(event) => setMessage(event.target.value)} />
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
              <p className="score">Score {chatResult.trust.score}</p>
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
