import React, { useState } from 'react'

function trustClass(score) {
  if (score < 50) return 'trust-low'
  if (score < 75) return 'trust-medium'
  return 'trust-high'
}

export default function TakeHomeScreen({ generated, parsed, onRestart }) {
  const [copied, setCopied] = useState(false)

  const configText = JSON.stringify(generated.config_snippet, null, 2)

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div>
      <div className="card">
        <h2>Your trust-gated connector is ready</h2>
        <p className="sub">
          The generated MCP server for <strong>{parsed.api_name}</strong> includes Valiron trust
          checks on every tool. Copy the config below to start using it.
        </p>

        <div className="valiron-badge" style={{ marginBottom: '1.5rem' }}>
          🛡️ Valiron trust layer is baked into the generated connector
        </div>

        <div className="section-label">MCP server config</div>
        <div className="copy-row">
          <span style={{ fontSize: '0.8rem', color: '#718096' }}>
            Add to your MCP client config
          </span>
          <button className="copy-btn" onClick={() => copy(configText)}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="code-block">{configText}</div>

        <div className="section-label">Trust thresholds per tool</div>
        {generated.trust_config.map((t) => (
          <div className="tool-summary-item" key={t.tool}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{t.name}</span>
            <span className={`trust-value ${trustClass(t.minScore)}`}>
              min score: {t.minScore}
            </span>
          </div>
        ))}

        <div className="section-label">Generated files</div>
        <div style={{ fontSize: '0.82rem', color: '#718096', lineHeight: 1.7 }}>
          <div>📄 <code>{generated.server_dir}/server.js</code> — MCP server with Valiron gates</div>
          <div>📄 <code>{generated.server_dir}/tools.json</code> — tool metadata for Claude</div>
          <div>📄 <code>{generated.server_dir}/package.json</code> — installable package</div>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn-secondary" onClick={onRestart}>Start over</button>
        <button
          className="btn-primary"
          onClick={() => copy(generated.server_code)}
        >
          Copy server.js
        </button>
      </div>
    </div>
  )
}
