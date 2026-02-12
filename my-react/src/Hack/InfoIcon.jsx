import React from 'react';

export default function InfoIcon({ onClick }) {
  return (
    <span 
      onClick={(e) => { 
        e.stopPropagation(); // Stop the click from bubbling up
        onClick(); 
      }}
      style={{
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '18px', 
        height: '18px', 
        borderRadius: '50%',
        background: 'rgba(56, 189, 248, 0.2)', 
        border: '1px solid #38bdf8',
        color: '#38bdf8', 
        fontSize: '11px', 
        fontWeight: 'bold',
        marginLeft: '8px', 
        cursor: 'pointer', 
        verticalAlign: 'middle',
        userSelect: 'none'
      }}
      title="Click for explanation"
    >
      ?
    </span>
  );
}