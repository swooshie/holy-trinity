import { useState } from "react";
import { ShieldCheck, WandSparkles } from "lucide-react";
import { generateConnector } from "../api";

export function GenerateScreen({ parsedApi, generated, setGenerated, next, previous }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const result = await generateConnector(parsedApi);
      setGenerated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="two-column">
      <div>
        <h2>Generate connector</h2>
        <p className="muted">The generated MCP server checks Valiron before every tool call.</p>
        <div className="trust-confirmation">
          <ShieldCheck size={20} />
          Trust layer enabled
        </div>
      </div>
      <div className="panel">
        <div className="summary-grid">
          <div><strong>{parsedApi?.actions?.filter((action) => action.enabled).length || 0}</strong><span>enabled tools</span></div>
          <div><strong>100%</strong><span>trust gated</span></div>
        </div>
        {error && <div className="error">{error}</div>}
        {generated && <div className="success">Generated {generated.tools.length} tools in {generated.server_dir}</div>}
        <div className="button-row">
          <button className="secondary-button" onClick={previous}>Back</button>
          <button className="primary-button" onClick={handleGenerate} disabled={loading}>
            <WandSparkles size={18} />
            {loading ? "Generating" : "Generate MCP"}
          </button>
          <button className="primary-button" onClick={next} disabled={!generated}>Try it</button>
        </div>
      </div>
    </div>
  );
}
