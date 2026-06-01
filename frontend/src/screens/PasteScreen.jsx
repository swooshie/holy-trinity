import React, { useState } from 'react'
import { parseSpec } from '../api.js'

const SAMPLE_SPEC = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'GoTogether', version: '1.0.0', description: 'Example ride coordination API for the Agentify + Valiron demo.' },
  servers: [{ url: 'https://api.gotogether.example.com' }],
  paths: {
    '/rides': {
      get: {
        operationId: 'listRides',
        summary: 'List rides',
        description: 'List available rides.',
        parameters: [{ name: 'city', in: 'query', required: false, description: 'City to search for rides in.', schema: { type: 'string' } }],
        responses: { 200: { description: 'Ride list.' } },
      },
      post: {
        operationId: 'createRide',
        summary: 'Create ride',
        description: 'Create a new ride listing.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['origin', 'destination', 'seats'],
                properties: {
                  origin: { type: 'string', description: 'Ride origin.' },
                  destination: { type: 'string', description: 'Ride destination.' },
                  seats: { type: 'number', description: 'Number of seats available.' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Ride created.' } },
      },
    },
    '/rides/{rideId}': {
      delete: {
        operationId: 'deleteRide',
        summary: 'Delete ride',
        description: 'Delete a ride listing.',
        parameters: [{ name: 'rideId', in: 'path', required: true, description: 'Ride identifier.', schema: { type: 'string' } }],
        responses: { 204: { description: 'Ride deleted.' } },
      },
    },
  },
}, null, 2)

export default function PasteScreen({ onParsed }) {
  const [spec, setSpec] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleParse() {
    setError(null)
    setLoading(true)
    try {
      const result = await parseSpec(spec || SAMPLE_SPEC)
      onParsed(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Paste your OpenAPI spec</h2>
      <p className="sub">
        Drop in a JSON or YAML OpenAPI spec. Agentify will detect actions and assign Valiron trust thresholds.
      </p>
      <textarea
        rows={14}
        placeholder="Paste OpenAPI spec here, or leave empty to use the sample GoTogether spec…"
        value={spec}
        onChange={(e) => setSpec(e.target.value)}
      />
      {error && <div className="error-msg">{error}</div>}
      <div className="btn-row">
        <button
          className="btn-primary"
          onClick={handleParse}
          disabled={loading}
        >
          {loading ? <><span className="spinner" /> Parsing…</> : 'Detect Actions'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => setSpec(SAMPLE_SPEC)}
          disabled={loading}
        >
          Load sample spec
        </button>
      </div>
    </div>
  )
}
