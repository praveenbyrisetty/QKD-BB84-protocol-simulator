import React from 'react';
import { EXPLANATIONS } from './explanations';

export default function ExplanationModal({ topic, onClose }) {
  if (!topic) return null;

  const content = EXPLANATIONS[topic];
  if (!content) return null;

  return (
    <div 
      onClick={onClose} 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0, 0, 0, 0.6)', 
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="speech-bubble" // <--- We use a class for the complex shape
        style={{
          background: '#1e293b', 
          border: '2px solid #38bdf8', // Thicker border looks better on bubbles
          boxShadow: '0 0 30px rgba(56, 189, 248, 0.2)',
          padding: '30px', 
          borderRadius: '20px', 
          maxWidth: '500px', 
          width: '90%',
          position: 'relative', 
          animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: 'transparent', border: 'none', color: '#94a3b8',
          fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1
        }}>&times;</button>

        <h2 style={{
          marginTop: 0, color: '#38bdf8', fontSize: '1.5rem', 
          borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px'
        }}>
          {content.title}
        </h2>
        
        <p style={{
          color: '#cbd5e1', lineHeight: '1.6', fontSize: '1rem', margin: 0
        }}>
          {content.text}
        </p>

        <div style={{marginTop: '20px', textAlign: 'right'}}>
          <button onClick={onClose} style={{
            background: '#38bdf8', color: '#0f172a', border: 'none',
            padding: '8px 24px', borderRadius: '30px', fontWeight: 'bold', 
            cursor: 'pointer'
          }}>
            Got it
          </button>
        </div>

        {/* --- CSS FOR THE TAIL SHAPE --- */}
        <style>{`
          /* Animation */
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

          /* The Triangle Tail Construction */
          .speech-bubble::before, .speech-bubble::after {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border-style: solid;
            /* Position: Bottom-Left like your image */
            bottom: -22px; 
            left: 40px; 
          }

          /* 1. The Border Triangle (Outer) */
          .speech-bubble::before {
            border-width: 22px 22px 0 0;
            border-color: #38bdf8 transparent transparent transparent;
          }

          /* 2. The Background Triangle (Inner - to mask the border) */
          .speech-bubble::after {
            bottom: -18px; /* Slightly higher to show the border */
            left: 42px;    /* Slight offset to match thickness */
            border-width: 18px 18px 0 0;
            border-color: #1e293b transparent transparent transparent;
          }
        `}</style>
      </div>
    </div>
  );
}