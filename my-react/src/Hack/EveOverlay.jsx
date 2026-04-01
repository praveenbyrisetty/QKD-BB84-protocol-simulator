import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  EveOverlay – full-screen info card when Eve intercepts (no animation) */
/* ------------------------------------------------------------------ */
export default function EveOverlay({ eveData, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  const garbled = eveData?.garbled_preview || 'X7F2A9';
  const qber = eveData?.qber || 0;
  const qubitsIntercepted = eveData?.qubits_intercepted || 0;
  const qubitsCorrect = eveData?.qubits_correct_basis || 0;
  const detected = qber > 0.11;

  if (dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={() => { setDismissed(true); onDismiss?.(); }}
    >
      {/* Dark blur backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(4px)',
      }} />

      {/* Scanline overlay texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
      }} />

      {/* Main card */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          width: 'min(560px, 90vw)',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #130010 50%, #0a0a1a 100%)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 0 60px rgba(239,68,68,0.25), 0 0 120px rgba(139,92,246,0.1), inset 0 0 40px rgba(239,68,68,0.05)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Corner decorations */}
        {['tl','tr','bl','br'].map(corner => (
          <div key={corner} style={{
            position: 'absolute',
            width: '20px', height: '20px',
            borderColor: '#ef4444',
            borderStyle: 'solid',
            borderWidth: corner.includes('t') ? '2px 0 0' : '0 0 2px',
            [corner.includes('l') ? 'left' : 'right']: '12px',
            [corner.includes('t') ? 'top' : 'bottom']: '12px',
            borderLeftWidth: corner.includes('l') ? '2px' : '0',
            borderRightWidth: corner.includes('r') ? '2px' : '0',
          }} />
        ))}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px', filter: 'drop-shadow(0 0 16px rgba(239,68,68,0.8))' }}>
            🕵️
          </div>
          <div style={{
            fontSize: '1.5rem', fontWeight: 900, letterSpacing: '4px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #ef4444, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            EVE INTERCEPT
          </div>
          <div style={{ fontSize: '0.7rem', color: '#ef4444', letterSpacing: '3px', marginTop: '4px', opacity: 0.7 }}>
            ◈ QUANTUM CHANNEL COMPROMISED ◈
          </div>
        </div>

        {/* Progress bar – static at 100% */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginBottom: '4px' }}>
            <span>QUBIT INTERCEPTION ANALYSIS</span>
            <span style={{ color: '#ef4444' }}>100%</span>
          </div>
          <div style={{ height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #ef4444)',
              boxShadow: '0 0 8px rgba(239,68,68,0.5)',
            }} />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Qubits Intercepted', value: qubitsIntercepted, color: '#c084fc', icon: '📡' },
            { label: 'Correct Guesses', value: `${qubitsCorrect}/${qubitsIntercepted}`, color: '#f59e0b', icon: '🎯' },
            { label: 'Error Rate (QBER)', value: `${(qber * 100).toFixed(1)}%`, color: detected ? '#ef4444' : '#22c55e', icon: '⚠️' },
            { label: 'Detection Risk', value: detected ? 'CRITICAL' : 'LOW', color: detected ? '#ef4444' : '#22c55e', icon: detected ? '🚨' : '✅' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              background: 'rgba(15,23,42,0.8)', border: `1px solid ${color}30`,
              borderRadius: '10px', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Garbled preview */}
        <div style={{
          background: '#000', border: '1px solid rgba(139,92,246,0.4)',
          borderRadius: '10px', padding: '14px', marginBottom: '20px',
          fontFamily: 'monospace',
        }}>
          <div style={{ fontSize: '0.62rem', color: '#8b5cf6', marginBottom: '8px', letterSpacing: '2px' }}>
            ◈ WHAT EVE SEES
          </div>
          <div style={{
            fontSize: '1.1rem', color: '#f59e0b', wordBreak: 'break-all',
            letterSpacing: '2px', fontWeight: 700,
          }}>
            {garbled}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '6px' }}>
            ⚡ Quantum state disturbed — original data irrecoverable
          </div>
        </div>

        {/* Bottom state */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          borderRadius: '10px',
          background: detected ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${detected ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        }}>
          {detected ? (
            <>
              <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
                🚨 Alice &amp; Bob WILL detect this interception!
              </div>
              <div style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                QBER {(qber * 100).toFixed(1)}% exceeds the 11% security threshold — key will be discarded.
              </div>
            </>
          ) : (
            <>
              <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
                ⚠️ Eve may go undetected this round
              </div>
              <div style={{ color: '#86efac', fontSize: '0.75rem' }}>
                QBER below threshold — but Eve only collected partial key bits.
              </div>
            </>
          )}
        </div>

        {/* Dismiss hint */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.65rem', color: '#334155', letterSpacing: '1px' }}>
          TAP ANYWHERE TO DISMISS
        </div>
      </div>
    </div>
  );
}
