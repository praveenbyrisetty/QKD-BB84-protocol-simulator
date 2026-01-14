import React from "react";
// DO NOT import CSS here

function EveToggle({ enabled, setEnabled }) {
  return (
    <div className="eve-toggle">
      <span className="eve-label">Eavesdropper (Eve)</span>
      
      {/* The actual switch */}
      <div
        className={`toggle-button ${enabled ? "toggle-on" : "toggle-off"}`}
        onClick={() => setEnabled(!enabled)}
        title="Toggle Eavesdropping"
      >
        <div className="toggle-knob"></div>
      </div>
      
      <span className={`toggle-status ${enabled ? "status-on" : "status-off"}`}>
        {enabled ? "ACTIVE" : "OFF"}
      </span>
    </div>
  );
}

export default EveToggle;