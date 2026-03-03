import React, { useState, useEffect, useRef } from 'react';

export default function QuantumChannelExpanded({ qubits, isEveOn, onClose, onPhotonClick }) {
  const [paused, setPaused] = useState(false);
  const [currentQubit, setCurrentQubit] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [progress, setProgress] = useState(0);
  const animRef = useRef(null);
  const cancelledRef = useRef(false);

  const visualQubits = qubits ? qubits.slice(0, 20) : [];

  const getParticleVisual = (q) => {
    if (q.aliceBasis === '+') return q.aliceBit === 0 ? '↑' : '→';
    return q.aliceBit === 0 ? '↗' : '↖';
  };

  const getBasisLabel = (basis) => basis === '+' ? 'Rectilinear (+)' : 'Diagonal (×)';

  useEffect(() => {
    if (visualQubits.length === 0 || paused) return;
    cancelledRef.current = false;

    const wait = (ms) => new Promise(resolve => {
      animRef.current = setTimeout(() => { if (!cancelledRef.current) resolve(); }, ms);
    });

    const runAnimation = async () => {
      setPhase('intro');
      setCurrentQubit(0);
      setProgress(0);
      await wait(2500);
      if (cancelledRef.current) return;

      for (let i = 0; i < visualQubits.length; i++) {
        if (cancelledRef.current) return;
        setCurrentQubit(i);

        setPhase('encode');
        setProgress(((i) / visualQubits.length) * 100);
        await wait(1200);
        if (cancelledRef.current) return;

        setPhase('transmit');
        await wait(1400);
        if (cancelledRef.current) return;

        if (isEveOn) {
          setPhase('intercept');
          await wait(1600);
          if (cancelledRef.current) return;
        }

        setPhase('measure');
        await wait(1200);
        if (cancelledRef.current) return;

        setPhase('result');
        await wait(1000);
        if (cancelledRef.current) return;

        setProgress(((i + 1) / visualQubits.length) * 100);
      }

      setPhase('done');
      setProgress(100);
      await wait(4000);
      if (cancelledRef.current) return;
      // Restart loop
      setPhase('intro');
      setCurrentQubit(0);
      setProgress(0);
    };

    runAnimation();
    return () => {
      cancelledRef.current = true;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [visualQubits.length, paused, isEveOn]);

  const q = visualQubits[currentQubit];

  const phaseInfo = () => {
    if (!q) return { icon: '📡', text: 'Waiting for qubits...', color: '#818cf8' };
    const basisMatch = q.aliceBasis === q.bobBasis;
    switch (phase) {
      case 'intro': return { icon: '🌐', text: 'Quantum channel initialized — photons will travel from Alice to Bob through fiber optic cable...', color: '#818cf8' };
      case 'encode': return { icon: '🔐', text: `Alice encodes bit ${q.aliceBit} using ${getBasisLabel(q.aliceBasis)} basis → Photon: ${getParticleVisual(q)}`, color: '#f43f5e' };
      case 'transmit': return { icon: '💫', text: `Photon ${getParticleVisual(q)} traveling through quantum channel...`, color: '#38bdf8' };
      case 'intercept': return { icon: '🕵️', text: `Eve intercepts! She measures with a random basis, disturbing the quantum state...`, color: '#ef4444' };
      case 'measure': return { icon: '📏', text: `Bob measures with ${getBasisLabel(q.bobBasis)} basis → Gets bit ${q.bobBit}`, color: '#22c55e' };
      case 'result': return {
        icon: basisMatch ? '✅' : '❌',
        text: basisMatch
          ? `Bases match (${q.aliceBasis}) — Bit ${q.aliceBit === q.bobBit ? 'correct' : 'ERROR from Eve'}, kept for sifted key`
          : `Bases differ (Alice: ${q.aliceBasis}, Bob: ${q.bobBasis}) — Bit discarded`,
        color: basisMatch ? (q.aliceBit === q.bobBit ? '#10b981' : '#ef4444') : '#64748b'
      };
      case 'done': return { icon: '🎉', text: `Transmission complete! ${visualQubits.length} photons sent through quantum channel.`, color: '#10b981' };
      default: return { icon: '', text: '', color: '#818cf8' };
    }
  };

  const info = phaseInfo();

  // Equipment component
  const Equipment = ({ name, emoji, color, side, active, label }) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      minWidth: '120px'
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '16px',
        background: active ? `linear-gradient(135deg, ${color}20, ${color}08)` : '#0f172a',
        border: `2px solid ${active ? color : '#1e293b'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
        boxShadow: active ? `0 0 30px ${color}30, 0 0 60px ${color}10` : 'none',
        transition: 'all 0.5s ease',
        transform: active ? 'scale(1.05)' : 'scale(1)',
        position: 'relative'
      }}>
        {emoji}
        {active && (
          <div style={{
            position: 'absolute', inset: '-3px', borderRadius: '18px',
            border: `2px solid ${color}`,
            animation: 'channelPulse 1.5s ease-in-out infinite',
            pointerEvents: 'none'
          }}></div>
        )}
      </div>
      <div style={{
        color: active ? color : '#475569',
        fontSize: '0.75rem', fontWeight: 700,
        letterSpacing: '1.5px', textTransform: 'uppercase',
        transition: 'color 0.3s'
      }}>{name}</div>
      {label && (
        <div style={{
          fontSize: '0.65rem', color: '#94a3b8',
          background: 'rgba(15,23,42,0.6)', padding: '4px 10px',
          borderRadius: '8px', border: '1px solid #1e293b',
          maxWidth: '140px', textAlign: 'center',
          animation: 'channelFadeIn 0.3s ease'
        }}>{label}</div>
      )}
    </div>
  );

  // Photon traveling through channel
  const PhotonInFlight = () => {
    if (!q || !['transmit', 'intercept'].includes(phase)) return null;
    const color = q.aliceBit === 1 ? '#ef4444' : '#3b82f6';
    return (
      <div
        onClick={() => onPhotonClick && onPhotonClick(q)}
        title="Click to inspect this photon in 3D"
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: `radial-gradient(circle, ${color}, ${color}80)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', fontWeight: 'bold', color: '#fff',
          animation: phase === 'intercept' ? 'channelGlitch 0.3s ease infinite' : 'channelFloat 1.5s ease-in-out infinite',
          position: 'relative', zIndex: 10,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.35)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {getParticleVisual(q)}
        {/* Glow trail */}
        <div style={{
          position: 'absolute', width: '60px', height: '60px',
          borderRadius: '50%', background: `radial-gradient(circle, ${color}30, transparent)`,
          animation: 'channelPulse 1s ease-in-out infinite',
          pointerEvents: 'none'
        }}></div>
      </div>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #020617 0%, #0c1029 50%, #020617 100%)',
      border: isEveOn && phase === 'intercept' ? '1px solid #ef444460' : '1px solid #6366f130',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '520px',
      boxShadow: isEveOn && phase === 'intercept'
        ? '0 0 60px rgba(239,68,68,0.15), inset 0 0 80px rgba(0,0,0,0.5)'
        : '0 0 60px rgba(99,102,241,0.08), inset 0 0 80px rgba(0,0,0,0.5)',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      transition: 'all 0.5s ease'
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none'
      }}></div>

      {/* Eve scanline effect */}
      {isEveOn && phase === 'intercept' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.03) 2px, rgba(239,68,68,0.03) 4px)',
          animation: 'channelScanline 3s linear infinite',
          pointerEvents: 'none', zIndex: 1
        }}></div>
      )}

      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px', position: 'relative', zIndex: 20 }}>
        <button onClick={() => setPaused(!paused)} style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
          border: '1px solid #6366f140',
          color: '#c7d2fe', fontSize: '0.78rem', padding: '7px 18px',
          borderRadius: '10px', cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s', letterSpacing: '0.5px'
        }}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
        <button onClick={onClose} style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
          border: '1px solid #ef444430',
          color: '#fca5a5', fontSize: '0.78rem', padding: '7px 18px',
          borderRadius: '10px', cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s'
        }}>✕ Close</button>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '8px', position: 'relative', zIndex: 5 }}>
        <h2 style={{
          margin: 0, fontSize: '1.1rem', fontWeight: 700,
          background: 'linear-gradient(90deg, #38bdf8, #818cf8, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '2px', textTransform: 'uppercase'
        }}>Quantum Channel — Photon Transmission</h2>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
          Photon <strong style={{ color: '#c7d2fe' }}>{currentQubit + 1}</strong> of <strong style={{ color: '#c7d2fe' }}>{visualQubits.length}</strong>
          {isEveOn && <span style={{ color: '#ef4444', marginLeft: '10px' }}>⚠ Eve is intercepting</span>}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '3px', borderRadius: '2px',
        background: 'rgba(56,189,248,0.1)',
        margin: '12px 0 16px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          background: isEveOn ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #38bdf8, #818cf8)',
          width: `${progress}%`,
          transition: 'width 0.5s ease',
          boxShadow: `0 0 10px ${isEveOn ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.5)'}`
        }}></div>
      </div>

      {/* STATUS CARD */}
      <div style={{
        background: `linear-gradient(135deg, ${info.color}10, ${info.color}05)`,
        border: `1px solid ${info.color}25`,
        borderRadius: '14px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '12px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.4s ease',
        boxShadow: `0 0 20px ${info.color}08`,
        position: 'relative', zIndex: 5
      }}>
        <span style={{ fontSize: '1.3rem' }}>{info.icon}</span>
        <span style={{
          fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4
        }}>{info.text}</span>
      </div>

      {/* MAIN CHANNEL VISUALIZATION */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 10px',
        position: 'relative', zIndex: 5,
        minHeight: '160px'
      }}>
        {/* Alice */}
        <Equipment
          name="Alice"
          emoji="👩‍💻"
          color="#f43f5e"
          side="left"
          active={phase === 'encode'}
          label={q && phase === 'encode' ? `Bit: ${q.aliceBit} | Basis: ${q.aliceBasis}` : null}
        />

        {/* Channel */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', margin: '0 10px'
        }}>
          {/* Fiber line */}
          <div style={{
            position: 'absolute', width: '100%', height: '2px',
            background: isEveOn && phase === 'intercept'
              ? 'linear-gradient(90deg, #f43f5e40, #ef444480, #f43f5e40)'
              : 'linear-gradient(90deg, #f43f5e40, #38bdf840, #22c55e40)',
            boxShadow: phase === 'transmit' ? '0 0 10px rgba(56,189,248,0.3)' : 'none',
            transition: 'all 0.3s'
          }}></div>

          {/* Photon */}
          <PhotonInFlight />

          {/* Eve intercept point */}
          {isEveOn && (
            <div style={{
              position: 'absolute', top: '-45px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: phase === 'intercept' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)',
                border: `1.5px solid ${phase === 'intercept' ? '#ef4444' : '#ef444430'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: phase === 'intercept' ? '0 0 20px rgba(239,68,68,0.3)' : 'none',
                transition: 'all 0.3s',
                animation: phase === 'intercept' ? 'channelPulse 0.8s ease-in-out infinite' : 'none'
              }}>🕵️</div>
              <div style={{
                fontSize: '0.55rem', color: phase === 'intercept' ? '#ef4444' : '#ef444460',
                fontWeight: 700, letterSpacing: '1px', transition: 'color 0.3s'
              }}>EVE</div>
            </div>
          )}
        </div>

        {/* Bob */}
        <Equipment
          name="Bob"
          emoji="👨‍💻"
          color="#22c55e"
          side="right"
          active={phase === 'measure'}
          label={q && phase === 'measure' ? `Basis: ${q.bobBasis} | Got: ${q.bobBit}` : null}
        />
      </div>

      {/* QUBIT LOG */}
      <div style={{
        marginTop: '20px', position: 'relative', zIndex: 5
      }}>
        <div style={{
          fontSize: '0.7rem', color: '#64748b', marginBottom: '10px',
          letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600
        }}>Transmission Log</div>
        <div style={{
          display: 'flex', gap: '4px', flexWrap: 'wrap',
          maxHeight: '120px', overflowY: 'auto', paddingRight: '5px'
        }}>
          {visualQubits.map((vq, i) => {
            const isPast = i < currentQubit;
            const isCurrent = i === currentQubit;
            const isFuture = i > currentQubit;
            const basisMatch = vq.aliceBasis === vq.bobBasis;
            const bitMatch = vq.aliceBit === vq.bobBit;
            const color = isPast
              ? (basisMatch ? (bitMatch ? '#10b981' : '#ef4444') : '#475569')
              : isCurrent ? '#38bdf8' : '#1e293b';

            return (
              <div
                key={i}
                onClick={() => onPhotonClick && onPhotonClick(vq)}
                title={`Click to inspect photon #${i + 1} in 3D`}
                style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: isCurrent
                    ? `linear-gradient(135deg, ${color}30, ${color}10)`
                    : isPast
                      ? `${color}15`
                      : '#0f172a',
                  border: `1.5px solid ${isCurrent ? color : isPast ? `${color}50` : '#1e293b40'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 'bold',
                  color: isFuture ? '#334155' : color,
                  transition: 'all 0.3s ease',
                  transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: isCurrent ? `0 0 12px ${color}40` : 'none',
                  opacity: isFuture ? 0.3 : 1,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isFuture) {
                    e.currentTarget.style.transform = 'scale(1.3)';
                    e.currentTarget.style.boxShadow = `0 0 14px ${color}60`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isCurrent ? 'scale(1.15)' : 'scale(1)';
                  e.currentTarget.style.boxShadow = isCurrent ? `0 0 12px ${color}40` : 'none';
                }}
              >
                {isPast ? (basisMatch ? (bitMatch ? '✓' : '✗') : '·') : getParticleVisual(vq)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Qubit Detail Card */}
      {q && phase !== 'intro' && phase !== 'done' && (
        <div style={{
          marginTop: '16px', position: 'relative', zIndex: 5,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px'
        }}>
          <div style={{
            background: 'rgba(244,63,94,0.06)', border: '1px solid #f43f5e20',
            borderRadius: '12px', padding: '12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.55rem', color: '#f43f5e', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>ALICE</div>
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{getParticleVisual(q)}</div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Bit: <strong style={{ color: '#e2e8f0' }}>{q.aliceBit}</strong></div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Basis: <strong style={{ color: '#f43f5e' }}>{q.aliceBasis}</strong></div>
          </div>

          <div style={{
            background: isEveOn ? 'rgba(239,68,68,0.06)' : 'rgba(56,189,248,0.06)',
            border: `1px solid ${isEveOn ? '#ef444420' : '#38bdf820'}`,
            borderRadius: '12px', padding: '12px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.55rem',
              color: isEveOn ? '#ef4444' : '#38bdf8',
              fontWeight: 700, letterSpacing: '1px', marginBottom: '6px'
            }}>{isEveOn ? 'EVE 🕵️' : 'CHANNEL'}</div>
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{isEveOn ? '⚡' : '📡'}</div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
              {isEveOn ? 'Intercept & Resend' : 'Fiber Optic'}
            </div>
            <div style={{ fontSize: '0.6rem', color: isEveOn ? '#fca5a5' : '#94a3b8' }}>
              {isEveOn ? 'State disturbed!' : 'No noise'}
            </div>
          </div>

          <div style={{
            background: 'rgba(34,197,94,0.06)', border: '1px solid #22c55e20',
            borderRadius: '12px', padding: '12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.55rem', color: '#22c55e', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>BOB</div>
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
              {phase === 'measure' || phase === 'result' ? (q.bobBit === 0 ? '↑' : '→') : '?'}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Bit: <strong style={{ color: '#e2e8f0' }}>{phase === 'measure' || phase === 'result' ? q.bobBit : '?'}</strong></div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Basis: <strong style={{ color: '#22c55e' }}>{q.bobBasis}</strong></div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes channelPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.08); }
        }
        @keyframes channelFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes channelFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes channelGlitch {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 1px); }
          50% { transform: translate(2px, -1px); }
          75% { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes channelScanline {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        @keyframes gridMove {
          from { transform: translateY(0); }
          to { transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
}
