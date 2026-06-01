import React, { useEffect, useState } from 'react'
import { generateConnector } from '../api.js'

const STEPS = [
  'Resolving OpenAPI schema…',
  'Extracting enabled actions…',
  'Applying trust thresholds…',
  'Generating MCP server code…',
  'Wiring Valiron trust gates…',
  'Writing tools.json and config…',
]

export default function GenerateScreen({ parsed, onGenerated, onBack }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        // Animate steps while the real request is in flight
        const interval = setInterval(() => {
          setStep((s) => {
            if (s < STEPS.length - 1) return s + 1
            clearInterval(interval)
            return s
          })
        }, 220)

        const result = await generateConnector(parsed)

        clearInterval(interval)
        if (!cancelled) {
          setStep(STEPS.length - 1)
          setDone(true)
          setTimeout(() => !cancelled && onGenerated(result), 800)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="card">
      <h2>Generating connector</h2>
      <p className="sub">Building a trust-gated MCP server for {parsed.api_name}.</p>

      {STEPS.map((label, i) => (
        <div className="progress-step" key={i}>
          <span className="icon">
            {i < step ? '✅' : i === step ? (done ? '✅' : <span className="spinner" />) : '⬜'}
          </span>
          <span style={{ color: i <= step ? '#e2e8f0' : '#4a5568' }}>{label}</span>
        </div>
      ))}

      {done && (
        <div className="valiron-badge">
          🛡️ Valiron trust layer enabled on all {parsed.actions.filter((a) => a.enabled).length} tools
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {error && (
        <div className="btn-row">
          <button className="btn-secondary" onClick={onBack}>Back</button>
        </div>
      )}
    </div>
  )
}
