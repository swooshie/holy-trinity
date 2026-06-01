import { useState } from "react";
import { FileInput } from "lucide-react";
import { parseSpec } from "../api";

export function PasteScreen({ spec, setSpec, setParsedApi, next }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    setLoading(true);
    setError("");
    try {
      const parsed = await parseSpec(spec);
      setParsedApi(parsed);
      next();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="two-column">
      <div>
        <h2>Paste OpenAPI spec</h2>
        <p className="muted">Agentify extracts operations and assigns Valiron trust thresholds by method risk.</p>
      </div>
      <div className="panel">
        <textarea value={spec} onChange={(event) => setSpec(event.target.value)} spellCheck="false" />
        {error && <div className="error">{error}</div>}
        <button className="primary-button" onClick={handleParse} disabled={loading}>
          <FileInput size={18} />
          {loading ? "Parsing" : "Parse actions"}
        </button>
      </div>
    </div>
  );
}
