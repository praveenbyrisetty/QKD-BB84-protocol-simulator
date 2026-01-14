import React from 'react';

export default function Controls({ step, actions }) {
  return (
    <div className="sticky-footer">
      <button 
        className={`btn ${step === 0 ? 'btn-primary' : ''}`} 
        onClick={actions.handleTransmit}
        disabled={step > 0}
      >
        1. Transmit
      </button>

      <button 
        className={`btn ${step === 1 ? 'btn-primary' : ''}`} 
        onClick={actions.handleSift}
        disabled={step !== 1}
      >
        2. Sift Bases
      </button>

      {/* NEW BUTTON: CASCADE */}
      <button 
        className={`btn ${step === 2 ? 'btn-primary' : ''}`} 
        onClick={actions.handleCascade}
        disabled={step !== 2}
      >
        3. Cascade (Error Correct)
      </button>

      {/* NEW BUTTON: PRIVACY AMP */}
      <button 
        className={`btn ${step === 3 ? 'btn-primary' : ''}`} 
        onClick={actions.handlePrivacyAmp}
        disabled={step !== 3}
      >
        4. Privacy Amp
      </button>

      <button className="btn btn-danger" onClick={actions.handleReset}>
        Reset
      </button>
    </div>
  );
}