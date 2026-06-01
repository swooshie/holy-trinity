import React, { useState } from 'react'
import { sendChat } from '../api.js'

const AGENTS = [
  { id: 'trusted-agent', label: 'Trusted Agent', sublabel: 'Score 90 · Tier AA', type: 'trusted' },
  { id: 'untrusted-agent', label: 'Untrusted Agent', sublabel: 'Score 25 · Tier D', type: 'untrusted' },
]

const PREFILL = 'Create a ride from the hackathon venue to the demo hall.'

function TrustCard({ trust }) {
  if (!trust) return null
  return (
    <div className={`trust-card ${trust.allow ? 'pass' : 'blocked'}`}>
      <div className="trust-card-top">
        <span className="trust-card-icon">{trust.allow ? '✅' : '🚫'}</span>
        <div className="trust-card-body">
          <h3>{trust.allow ? 'Trust check passed' : 'Trust check blocked'}</h3>
          <p>{trust.message}</p>
        </div>
        <div className="trust-score-display">
          <div className="trust-score-number">{trust.score ?? '—'}</div>
          <div className="trust-score-label">score</div>
        </div>
      </div>
      <div className="trust-score-bar">
        <div className="trust-score-fill" style={{ width: `${trust.score ?? 0}%` }} />
      </div>
      <div className="trust-meta">
        <span>Tier: {trust.tier ?? '—'}</span>
        <span>Risk: {trust.riskLevel ?? '—'}</span>
        <span>Route: {trust.route ?? '—'}</span>
      </div>
    </div>
  )
}

export default function TryItScreen({ generated, parsed, onBack, onFinish }) {
  const [agentId, setAgentId] = useState(AGENTS[0].id)
  const [message, setMessage] = useState(PREFILL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSend() {
    if (!message.trim()) return
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await sendChat(
        message,
        generated.tools,
        parsed.base_url,
        null,
        agentId
      )
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Try it live</h2>
        <p className="sub">
          Select an agent and send a request. See how Valiron gates tool execution in real time.
        </p>

        <div className="agent-selector">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              className={`agent-btn ${agent.type}${agentId === agent.id ? ' active' : ''}`}
              onClick={() => { setAgentId(agent.id); setResult(null) }}
            >
              <div>{agent.label}</div>
              <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', opacity: 0.8 }}>
                {agent.sublabel}
              </div>
            </button>
          ))}
        </div>

        {result && <TrustCard trust={result.trust} />}

        <div className="messages">
          {result?.reply && (
            <div className="message assistant">{result.reply}</div>
          )}
          {result?.trust && !result.trust.allow && (
            <div className="message assistant" style={{ color: '#fca5a5' }}>
              Request blocked — agent does not meet the required trust threshold.
            </div>
          )}
        </div>

        {result?.tool_calls?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#718096', marginBottom: '0.4rem' }}>
              TOOL CALLS
            </div>
            {result.tool_calls.map((tc, i) => (
              <span key={i} className="tool-call">
                {tc.tool}({JSON.stringify(tc.input)})
              </span>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Type a request…"
          />
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={loading || !message.trim()}
          >
            {loading ? <span className="spinner" /> : 'Send'}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="btn-row">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={onFinish}>Take home config →</button>
      </div>
    </div>
  )
}
