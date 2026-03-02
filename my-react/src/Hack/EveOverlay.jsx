import React, { useEffect, useState, useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  EveOverlay – full-screen dramatic flash when Eve intercepts         */
/* ------------------------------------------------------------------ */
export default function EveOverlay({ eveData, onDismiss }) {
  const [phase, setPhase] = useState('enter');   // enter → scanning → done
  const [scanLine, setScanLine] = useState(0);
  const [glitchText, setGlitchText] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const GLITCH_CHARS = '▓░▒█▄▀■□●○◆◇★☆∆∇⊕⊗≠≈≡∞∑∏∫∂∇λψωΩΦΞΣΠ01';
  const garbled = eveData?.garbled_preview || 'X7F2A9';
  const qber = eveData?.qber || 0;
  const qubitsIntercepted = eveData?.qubits_intercepted || 0;
  const qubitsCorrect = eveData?.qubits_correct_basis || 0;
  const detected = qber > 0.11;

  // Generate random glitch string
  const randomGlitch = (len = 16) =>
    Array.from({ length: len }, () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join('');

  useEffect(() => {
    if (dismissed) return;

    // Phase 1: enter (glitch flash)
    const t1 = setTimeout(() => setPhase('scanning'), 400);
    // Phase 2: scanning bar animation
    const t2 = setTimeout(() => setShowStats(true), 1200);
    // Phase 3: hold, then auto-dismiss after 7s
    const t3 = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => { setDismissed(true); onDismiss?.(); }, 500);
    }, 7000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [dismissed]);

  // Glitch text flicker
  useEffect(() => {
    const id = setInterval(() => setGlitchText(randomGlitch(garbled.length)), 80);
    const stop = setTimeout(() => clearInterval(id), 900);
    return () => { clearInterval(id); clearTimeout(stop); };
  }, []);

  // Scan line animation
  useEffect(() => {
    if (phase !== 'scanning') return;
    startRef.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / 800, 1);
      setScanLine(Math.floor(progress * 100));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (dismissed) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: phase === 'exit' ? 'eveOverlayOut 0.5s ease-in forwards' : 'eveOverlayIn 0.3s ease-out',
      cursor: 'pointer',
    }} onClick={() => { setDismissed(true); onDismiss?.(); }}>
      {/* Dark blur backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(4px)',
      }} />

      {/* Red scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: `${scanLine}%`,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #ef4444, #ff0000, #ef4444, transparent)',
        boxShadow: '0 0 20px 4px rgba(239,68,68,0.6)',
        transition: 'top 0.01s linear',
        opacity: phase === 'scanning' ? 1 : 0,
      }} />

      {/* Scanline overlay texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
      }} />

      {/* Main card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(560px, 90vw)',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #130010 50%, #0a0a1a 100%)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 0 60px rgba(239,68,68,0.25), 0 0 120px rgba(139,92,246,0.1), inset 0 0 40px rgba(239,68,68,0.05)',
        animation: 'cardGlitch 0.4s steps(2) 0s 2',
      }} onClick={e => e.stopPropagation()}>

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
          <div style={{ fontSize: '3rem', marginBottom: '8px', filter: 'drop-shadow(0 0 16px rgba(239,68,68,0.8))', animation: 'spyBounce 0.6s ease-out' }}>
            🕵️
          </div>
          <div style={{
            fontSize: '1.5rem', fontWeight: 900, letterSpacing: '4px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #ef4444, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            animation: 'glitchTitle 0.5s steps(2) 2',
          }}>
            {phase === 'enter' ? glitchText.slice(0, 14) || 'EVE INTERCEPT' : 'EVE INTERCEPT'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#ef4444', letterSpacing: '3px', marginTop: '4px', opacity: 0.7 }}>
            ◈ QUANTUM CHANNEL COMPROMISED ◈
          </div>
        </div>

        {/* Scan progress bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginBottom: '4px' }}>
            <span>QUBIT INTERCEPTION ANALYSIS</span>
            <span style={{ color: '#ef4444' }}>{scanLine}%</span>
          </div>
          <div style={{ height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${scanLine}%`,
              background: 'linear-gradient(90deg, #8b5cf6, #ef4444)',
              boxShadow: '0 0 8px rgba(239,68,68,0.5)',
              transition: 'width 0.05s linear',
            }} />
          </div>
        </div>

        {/* Stats grid */}
        {showStats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', animation: 'statsReveal 0.4s ease-out' }}>
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
        )}

        {/* Garbled preview */}
        {showStats && (
          <div style={{
            background: '#000', border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '10px', padding: '14px', marginBottom: '20px',
            fontFamily: 'monospace', animation: 'statsReveal 0.4s ease-out 0.1s both',
          }}>
            <div style={{ fontSize: '0.62rem', color: '#8b5cf6', marginBottom: '8px', letterSpacing: '2px' }}>
              ◈ WHAT EVE SEES
            </div>
            <div style={{
              fontSize: '1.1rem', color: '#f59e0b', wordBreak: 'break-all',
              letterSpacing: '2px', fontWeight: 700,
              animation: 'garbleFlicker2 2s ease-in-out infinite',
            }}>
              {garbled}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '6px' }}>
              ⚡ Quantum state disturbed — original data irrecoverable
            </div>
          </div>
        )}

        {/* Bottom state */}
        {showStats && (
          <div style={{
            textAlign: 'center',
            padding: '12px',
            borderRadius: '10px',
            background: detected ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${detected ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            animation: 'statsReveal 0.4s ease-out 0.2s both',
          }}>
            {detected ? (
              <>
                <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
                  🚨 Alice & Bob WILL detect this interception!
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
        )}

        {/* Dismiss hint */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.65rem', color: '#334155', letterSpacing: '1px' }}>
          TAP ANYWHERE TO DISMISS
        </div>
      </div>

      <style>{`
        @keyframes eveOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes eveOverlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes cardGlitch {
          0%   { transform: translate(0,0) skewX(0deg); filter: hue-rotate(0deg); }
          25%  { transform: translate(-4px, 2px) skewX(-2deg); filter: hue-rotate(90deg); }
          50%  { transform: translate(4px, -2px) skewX(1deg); filter: hue-rotate(180deg); }
          75%  { transform: translate(-2px, 0px) skewX(-1deg); filter: hue-rotate(270deg); }
          100% { transform: translate(0,0) skewX(0deg); filter: hue-rotate(0deg); }
        }
        @keyframes glitchTitle {
          0%,100% { clip-path: inset(0 0 0 0); }
          25% { clip-path: inset(30% 0 20% 0); transform: translate(-3px); }
          50% { clip-path: inset(10% 0 60% 0); transform: translate(3px); }
          75% { clip-path: inset(60% 0 10% 0); transform: translate(-2px); }
        }
        @keyframes spyBounce {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes statsReveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes garbleFlicker2 {
          0%,100% { opacity: 1; letter-spacing: 2px; }
          40% { opacity: 0.5; letter-spacing: 4px; filter: blur(1px); }
          70% { opacity: 0.8; letter-spacing: 1px; }
        }
      `}</style>
    </div>
  );
}
