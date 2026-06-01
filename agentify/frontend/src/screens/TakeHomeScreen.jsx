import { Download, ShieldCheck } from "lucide-react";

export function TakeHomeScreen({ generated, previous }) {
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
    </div>
  );
}
