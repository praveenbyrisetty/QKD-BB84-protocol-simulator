import React from 'react';
import InfoIcon from './InfoIcon'; // Import the new icon component

export default function Header({ isEveOn, setIsEveOn, step, onHelp }) {
  return (
    <nav className="top-nav">
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        BB84 Simulator
        {/* 1. Add Info Icon for the Main Title */}
        <InfoIcon onClick={() => onHelp('bb84')} />
      </div>
      
      <div className="eve-toggle">
        <span style={{
          color: isEveOn ? '#ef4444' : '#94a3b8', 
          marginRight: '10px',
          fontWeight: 'bold',
          transition: 'color 0.3s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          Eve: {isEveOn ? "INTERCEPTING" : "OFF"}
          {/* 2. Add Info Icon for the Eve Toggle */}
          <InfoIcon onClick={() => onHelp('eve')} />
        </span>
        
        <label className="switch">
          <input 
            type="checkbox" 
            checked={isEveOn} 
            onChange={(e) => setIsEveOn(e.target.checked)} 
            disabled={step > 0} 
          />
          <span className="slider"></span>
        </label>
      </div>
    </nav>
  );
}
