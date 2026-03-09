import React, { useRef, useEffect, useState } from 'react';

export default function FixedBubble({ title, text, x, y, onClose }) {
  const bubbleRef = useRef(null);
  const [adjustedX, setAdjustedX] = useState(x);
  const [adjustedY, setAdjustedY] = useState(y);
  const [expanded, setExpanded] = useState(false);

  // Reset expanded state when bubble changes
  useEffect(() => {
    setExpanded(false);
  }, [title]);

  // Logic to keep bubble inside the screen
  useEffect(() => {
    if (bubbleRef.current && title) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const margin = 20;

      let newX = x + 15;
      let newY = y + 15;

      if (newX + rect.width > screenWidth - margin) {
        newX = x - rect.width - 15;
      }
      if (newX < margin) {
        newX = margin;
      }
      if (newY + rect.height > screenHeight - margin) {
        newY = y - rect.height - 15;
      }
      if (newY < margin) {
        newY = margin;
      }

      setAdjustedX(newX);
      setAdjustedY(newY);
    }
  }, [x, y, title, expanded]);

  if (!title) return null;

  const bubbleWidth = expanded ? '460px' : '260px';
  const fontSize = expanded ? '0.9rem' : '0.8rem';

  return (
    <div 
      ref={bubbleRef}
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        width: bubbleWidth,
        maxHeight: expanded ? '70vh' : '220px',
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(14px)',
        border: `1px solid ${expanded ? '#6366f1' : '#38bdf8'}`,
        borderRadius: '14px',
        padding: expanded ? '18px' : '12px',
        color: '#e2e8f0',
        zIndex: 10000,
        boxShadow: expanded
          ? '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(99,102,241,0.15)'
          : '0 10px 25px rgba(0,0,0,0.6)',
        pointerEvents: 'auto',
        animation: 'fadeIn 0.2s ease-out',
        transition: 'width 0.3s ease, max-height 0.3s ease, padding 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        overflowY: expanded ? 'auto' : 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px',
      }}>
        <h4 style={{ margin: 0, color: expanded ? '#6366f1' : '#38bdf8', fontSize: expanded ? '1.05rem' : '0.95rem', transition: 'all 0.3s' }}>
          {title}
        </h4>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Expand / Collapse button */}
          <button onClick={() => setExpanded(prev => !prev)} style={{
            background: expanded ? 'rgba(99,102,241,0.15)' : 'rgba(56,189,248,0.1)',
            border: `1px solid ${expanded ? '#6366f140' : '#38bdf830'}`,
            color: expanded ? '#a5b4fc' : '#7dd3fc',
            fontSize: '0.65rem', cursor: 'pointer', padding: '2px 8px',
            borderRadius: '6px', lineHeight: 1.3, fontFamily: 'monospace',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = expanded ? 'rgba(99,102,241,0.25)' : 'rgba(56,189,248,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = expanded ? 'rgba(99,102,241,0.15)' : 'rgba(56,189,248,0.1)'; }}
          >
            {expanded ? '◀ Collapse' : 'Expand ▶'}
          </button>
          {/* Close button */}
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem',
            cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >×</button>
        </div>
      </div>

      {/* Content */}
      <p style={{
        margin: 0, fontSize, lineHeight: expanded ? '1.6' : '1.4',
        transition: 'all 0.3s',
        color: expanded ? '#cbd5e1' : '#e2e8f0',
      }}>
        {text}
      </p>

      {/* Expand hint when collapsed */}
      {!expanded && text && text.length > 120 && (
        <div style={{
          marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #1e293b',
          textAlign: 'center',
        }}>
          <span
            onClick={() => setExpanded(true)}
            style={{
              fontSize: '0.65rem', color: '#6366f1', cursor: 'pointer',
              fontFamily: 'monospace', letterSpacing: '0.5px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#818cf8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
          >
            ▾ Click to read more
          </span>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}