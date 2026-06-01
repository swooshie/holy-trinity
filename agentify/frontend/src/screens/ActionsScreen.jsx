import { ArrowRight } from "lucide-react";

export function ActionsScreen({ parsedApi, setParsedApi, next, previous }) {
  function updateAction(actionId, patch) {
    setParsedApi({
      ...parsedApi,
      actions: parsedApi.actions.map((action) => (action.id === actionId ? { ...action, ...patch } : action))
    });
  }

  return (
    <div>
      <div className="screen-heading">
        <div>
          <h2>Review actions</h2>
          <p className="muted">{parsedApi?.api_name} detected {parsedApi?.actions?.length || 0} actions.</p>
        </div>
        <div className="button-row">
          <button className="secondary-button" onClick={previous}>Back</button>
          <button className="primary-button" onClick={next}>
            Generate
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="action-list">
        {parsedApi?.actions?.map((action) => (
          <article className="action-card" key={action.id}>
            <div className="action-topline">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={action.enabled}
                  onChange={(event) => updateAction(action.id, { enabled: event.target.checked })}
                />
                <span>{action.name}</span>
              </label>
              <span className={`method method-${action.method.toLowerCase()}`}>{action.method}</span>
            </div>
            <p className="path">{action.path}</p>
            <p className="muted compact">{action.description}</p>
            <div className="threshold-row">
              <span>{thresholdLabel(action.trustThreshold)}</span>
              <strong>{action.trustThreshold}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={action.trustThreshold}
              disabled={!action.enabled}
              onChange={(event) => updateAction(action.id, { trustThreshold: Number(event.target.value) })}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function thresholdLabel(value) {
  if (value >= 80) {
    return "High trust";
  }
  if (value >= 55) {
    return "Medium trust";
  }
  return "Low trust";
}
