import { useMemo, useState } from "react";
import { PasteScreen } from "./screens/PasteScreen.jsx";
import { ActionsScreen } from "./screens/ActionsScreen.jsx";
import { GenerateScreen } from "./screens/GenerateScreen.jsx";
import { TryItScreen } from "./screens/TryItScreen.jsx";
import { TakeHomeScreen } from "./screens/TakeHomeScreen.jsx";
import { sampleSpec } from "./fixtures";

const steps = ["Paste", "Actions", "Generate", "Try it", "Take home"];

export default function App() {
  const [step, setStep] = useState(0);
  const [spec, setSpec] = useState(sampleSpec);
  const [parsedApi, setParsedApi] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [chatResult, setChatResult] = useState(null);

  const screenProps = useMemo(
    () => ({
      spec,
      setSpec,
      parsedApi,
      setParsedApi,
      generated,
      setGenerated,
      chatResult,
      setChatResult,
      next: () => setStep((current) => Math.min(current + 1, steps.length - 1)),
      previous: () => setStep((current) => Math.max(current - 1, 0)),
      goTo: setStep
    }),
    [spec, parsedApi, generated, chatResult]
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Agentify + Valiron</p>
          <h1>Trust-gated MCP connector builder</h1>
        </div>
        <div className="trust-pill">Valiron enabled</div>
      </header>

      <nav className="stepper" aria-label="Build steps">
        {steps.map((label, index) => (
          <button
            key={label}
            className={index === step ? "step active" : "step"}
            onClick={() => setStep(index)}
            disabled={index > 0 && !parsedApi}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>

      <section className="screen">
        {step === 0 && <PasteScreen {...screenProps} />}
        {step === 1 && <ActionsScreen {...screenProps} />}
        {step === 2 && <GenerateScreen {...screenProps} />}
        {step === 3 && <TryItScreen {...screenProps} />}
        {step === 4 && <TakeHomeScreen {...screenProps} />}
      </section>
    </main>
  );
}
