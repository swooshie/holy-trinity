import React, { useState } from 'react'

function trustLabel(score) {
  if (score < 50) return 'LOW'
  if (score < 75) return 'MEDIUM'
  return 'HIGH'
}

function trustClass(score) {
  if (score < 50) return 'trust-low'
  if (score < 75) return 'trust-medium'
  return 'trust-high'
}

export default function ActionsScreen({ parsed, onGenerate, onBack }) {
  const [actions, setActions] = useState(parsed.actions)

  function toggle(id) {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    )
  }

  function setThreshold(id, value) {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, trustThreshold: Number(value) } : a))
    )
  }

  const enabledCount = actions.filter((a) => a.enabled).length

  return (
    <div>
      <div className="card">
        <h2>{parsed.api_name}</h2>
        <p className="sub">
          {parsed.api_description} &mdash; {enabledCount} of {actions.length} actions enabled.
          Adjust trust thresholds before generating the connector.
        </p>

        {actions.map((action) => {
          const label = trustLabel(action.trustThreshold)
          return (
            <div
              key={action.id}
              className={`action-item${!action.enabled ? ' disabled-action' : ''}`}
            >
              <div className="action-header">
                <span className={`method-badge method-${action.method}`}>{action.method}</span>
                <span className="action-name">{action.name}</span>
                <span className="action-path">{action.path}</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={action.enabled}
                    onChange={() => toggle(action.id)}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>

              {action.enabled && (
                <div className="trust-row">
                  <label>Trust threshold</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={action.trustThreshold}
                    onChange={(e) => setThreshold(action.id, e.target.value)}
                  />
                  <span className={`trust-value ${trustClass(action.trustThreshold)}`}>
                    {action.trustThreshold}
                  </span>
                  <span className={`trust-label-pill trust-label-${label}`}>{label}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="btn-row">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button
          className="btn-primary"
          onClick={() => onGenerate({ ...parsed, actions })}
          disabled={enabledCount === 0}
        >
          Generate Connector
        </button>
      </div>
    </div>
  )
}
