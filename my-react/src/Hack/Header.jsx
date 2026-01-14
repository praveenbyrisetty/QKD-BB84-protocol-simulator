import React from 'react';

export default function Header({ isEveOn, setIsEveOn, step }) {
  return (
    <nav className="top-nav">
      <div className="nav-brand">BB84 Simulator</div>
      
      <div className="eve-toggle">
        <span style={{
          color: isEveOn ? '#ef4444' : '#94a3b8', 
          marginRight: '10px',
          fontWeight: 'bold',
          transition: 'color 0.3s'
        }}>
          Eve: {isEveOn ? "INTERCEPTING" : "OFF"}
        </span>
        
        <label className="switch">
          <input 
            type="checkbox" 
            checked={isEveOn} 
            // DIRECTLY CALL SET STATE HERE
            onChange={(e) => setIsEveOn(e.target.checked)} 
            disabled={step > 0} 
          />
          <span className="slider"></span>
        </label>
      </div>
    </nav>
  );
}