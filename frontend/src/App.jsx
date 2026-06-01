import React, { useState } from 'react'
import PasteScreen from './screens/PasteScreen.jsx'
import ActionsScreen from './screens/ActionsScreen.jsx'
import GenerateScreen from './screens/GenerateScreen.jsx'
import TryItScreen from './screens/TryItScreen.jsx'
import TakeHomeScreen from './screens/TakeHomeScreen.jsx'

const STEPS = ['Paste spec', 'Review actions', 'Generate', 'Try it', 'Take home']

export default function App() {
  const [screen, setScreen] = useState(0)
  const [parsed, setParsed] = useState(null)
  const [generated, setGenerated] = useState(null)

  function restart() {
    setParsed(null)
    setGenerated(null)
    setScreen(0)
  }

  return (
    <>
      <header style={{ marginBottom: '0.5rem' }}>
        <div className="brand-bar">
          <span className="brand-name">Agentify</span>
          <span className="brand-sep">+</span>
          <span className="brand-partner">Valiron</span>
          <span className="brand-tagline">Trust-gated MCP connector builder</span>
        </div>

        <nav className="stepper">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`step ${i === screen ? 'active' : i < screen ? 'done' : ''}`}
            >
              <div className="step-dot">{i < screen ? '✓' : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </nav>
      </header>

      {screen === 0 && (
        <PasteScreen
          onParsed={(result) => {
            setParsed(result)
            setScreen(1)
          }}
        />
      )}

      {screen === 1 && parsed && (
        <ActionsScreen
          parsed={parsed}
          onBack={() => setScreen(0)}
          onGenerate={(updatedParsed) => {
            setParsed(updatedParsed)
            setScreen(2)
          }}
        />
      )}

      {screen === 2 && parsed && (
        <GenerateScreen
          parsed={parsed}
          onBack={() => setScreen(1)}
          onGenerated={(result) => {
            setGenerated(result)
            setScreen(3)
          }}
        />
      )}

      {screen === 3 && generated && (
        <TryItScreen
          generated={generated}
          parsed={parsed}
          onBack={() => setScreen(2)}
          onFinish={() => setScreen(4)}
        />
      )}

      {screen === 4 && generated && (
        <TakeHomeScreen
          generated={generated}
          parsed={parsed}
          onRestart={restart}
        />
      )}
    </>
  )
}
