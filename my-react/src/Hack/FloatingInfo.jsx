import React from 'react';
import { EXPLANATIONS } from './explanations';

export default function FloatingInfo({ topic }) {
  if (!topic) return null;

  const content = EXPLANATIONS[topic];
  if (!content) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      background: 'rgba(15, 23, 42, 0.95)', // Dark background
      border: '1px solid #38bdf8',           // Neon Blue Border
      borderRadius: '12px',
      padding: '20px',
      color: '#fff',
      boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out',
      pointerEvents: 'none' // Allows clicking through it if needed
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8', fontSize: '1.1rem' }}>
        {content.title}
      </h4>
      <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
        {content.text}
      </p>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}