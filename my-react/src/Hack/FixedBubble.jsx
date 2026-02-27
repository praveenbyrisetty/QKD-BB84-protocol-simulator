import React, { useRef, useEffect, useState } from 'react';

export default function FixedBubble({ title, text, x, y, onClose }) {
  const bubbleRef = useRef(null);
  const [adjustedX, setAdjustedX] = useState(x);
  const [adjustedY, setAdjustedY] = useState(y);

  // Logic to keep bubble inside the screen
  useEffect(() => {
    if (bubbleRef.current && title) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const margin = 20; // Safe margin from edges

      let newX = x + 15;
      let newY = y + 15;

      // Check right edge - flip to left of cursor
      if (newX + rect.width > screenWidth - margin) {
        newX = x - rect.width - 15;
      }
      
      // Check left edge - ensure it doesn't go off the left side
      if (newX < margin) {
        newX = margin;
      }

      // Check bottom edge - flip above cursor
      if (newY + rect.height > screenHeight - margin) {
        newY = y - rect.height - 15;
      }
      
      // Check top edge - ensure it doesn't go off the top
      if (newY < margin) {
        newY = margin;
      }

      setAdjustedX(newX);
      setAdjustedY(newY);
    }
  }, [x, y, title]);

  if (!title) return null;

  return (
    <div 
      ref={bubbleRef}
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        width: '260px',
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #38bdf8',
        borderRadius: '12px',
        padding: '12px',
        color: '#e2e8f0',
        zIndex: 10000,
        boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
        pointerEvents: 'auto',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', borderBottom:'1px solid #334155', paddingBottom:'4px' }}>
        <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>
          {title}
        </h4>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem',
          cursor: 'pointer', padding: '0 0 0 8px', lineHeight: 1,
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
        >×</button>
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
        {text}
      </p>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}