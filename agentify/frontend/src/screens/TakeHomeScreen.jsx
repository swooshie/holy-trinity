import { Download, ShieldCheck } from "lucide-react";

export function TakeHomeScreen({ generated, demoStatus, previous }) {
  const connectorUrl = generated?.config_snippet?.mcpServers
    ? Object.values(generated.config_snippet.mcpServers)[0]?.url
    : "";

  return (
    <div>
      <div className="screen-heading">
        <div>
          <h2>Take home</h2>
          <p className="muted">Use the generated MCP config and trust summary after the demo.</p>
        </div>
        <button className="secondary-button" onClick={previous}>Back</button>
      </div>

      <div className="takehome-grid">
        <div className="panel">
          <div className="panel-title">
            <Download size={18} />
            MCP config
          </div>
          <pre>{JSON.stringify(generated?.config_snippet || {}, null, 2)}</pre>
          {connectorUrl && <p className="muted">Connector URL: {connectorUrl}</p>}
        </div>
        <div className="panel">
          <div className="panel-title">
            <ShieldCheck size={18} />
            Valiron trust config
          </div>
          <div className="trust-list">
            {generated?.trust_config?.map((item) => (
              <div key={item.tool} className="trust-row">
                <span>{item.name}</span>
                <strong>{item.minScore}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel runtime-panel">
        <div className="panel-title">
          <ShieldCheck size={18} />
          Runtime status
        </div>
        <div className="runtime-grid">
          <div><span>Trust</span><strong>{demoStatus?.trustMode || "deterministic"}</strong></div>
          <div><span>Chat</span><strong>{demoStatus?.chatMode || "deterministic"}</strong></div>
          <div><span>Tools</span><strong>{demoStatus?.toolExecution || "mock"}</strong></div>
          <div><span>Backend</span><strong>{demoStatus?.backend || "ready"}</strong></div>
        </div>
      </div>
    </div>
  );
}
