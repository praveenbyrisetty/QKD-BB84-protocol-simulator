import React, { useState, useEffect, useRef } from 'react';

export default function PrivacyAmpExpanded({ finalKey, correctedKey, onClose }) {
  const inputKey = correctedKey || '';
  const outputKey = (finalKey && typeof finalKey === 'object') ? finalKey.join('') : (finalKey || '');
  const isDone = outputKey.length > 0;

  // Animation state
  const [phase, setPhase] = useState('intro');
  // intro → feedBits → hashing → extracting → done
  const [feedIdx, setFeedIdx] = useState(0);
  const [hashProgress, setHashProgress] = useState(0);
  const [outputIdx, setOutputIdx] = useState(0);
  const [matrixGlow, setMatrixGlow] = useState(false);
  const [particles, setParticles] = useState([]);
  const cancelledRef = useRef(false);
  const animRef = useRef(null);

  useEffect(() => {
    if (!inputKey.length) return;
    cancelledRef.current = false;

    const wait = (ms) => new Promise(resolve => {
      animRef.current = setTimeout(() => { if (!cancelledRef.current) resolve(); }, ms);
    });

    const run = async () => {
      // Intro
      setPhase('intro');
      setFeedIdx(0);
      setHashProgress(0);
      setOutputIdx(0);
      setMatrixGlow(false);
      await wait(1800);
      if (cancelledRef.current) return;

      // Feed bits into hash
      setPhase('feedBits');
      const displayCount = Math.min(inputKey.length, 40);
      for (let i = 0; i < displayCount; i++) {
        if (cancelledRef.current) return;
        setFeedIdx(i + 1);
        // Spawn particle
        setParticles(prev => [...prev.slice(-8), { id: Date.now(), bit: inputKey[i] }]);
        await wait(80);
      }
      await wait(400);
      if (cancelledRef.current) return;

      // Hashing
      setPhase('hashing');
      setMatrixGlow(true);
      for (let p = 0; p <= 100; p += 2) {
        if (cancelledRef.current) return;
        setHashProgress(p);
        await wait(30);
      }
      await wait(600);
      if (cancelledRef.current) return;

      // Extracting output bits
      setPhase('extracting');
      setMatrixGlow(false);
      const outLen = outputKey.length || 8;
      for (let i = 0; i < outLen; i++) {
        if (cancelledRef.current) return;
        setOutputIdx(i + 1);
        await wait(120);
      }
      await wait(500);
      if (cancelledRef.current) return;

      // Done
      setPhase('done');
      await wait(5000);
      if (cancelledRef.current) return;

      // Restart
      run();
    };

    run();
    return () => {
      cancelledRef.current = true;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [inputKey.length, outputKey.length]);

  const phaseInfo = () => {
    switch (phase) {
      case 'intro': return { icon: '🔐', text: 'Preparing Privacy Amplification — shrinking the key to remove Eve\'s knowledge...', color: '#10b981' };
      case 'feedBits': return { icon: '📥', text: `Feeding corrected key bits into the hash function... (${feedIdx}/${Math.min(inputKey.length, 40)})`, color: '#38bdf8' };
      case 'hashing': return { icon: '⚙️', text: `Universal hash function processing... ${hashProgress}%`, color: '#a78bfa' };
      case 'extracting': return { icon: '📤', text: `Extracting shortened secret key... (${outputIdx}/${outputKey.length || '?'} bits)`, color: '#10b981' };
      case 'done': return { icon: '✅', text: `Privacy Amplification complete! ${inputKey.length} bits → ${outputKey.length} bits (${((outputKey.length/inputKey.length)*100).toFixed(0)}% compression)`, color: '#10b981' };
      default: return { icon: '', text: '', color: '#10b981' };
    }
  };

  const info = phaseInfo();
  const displayInputBits = inputKey.slice(0, 40).split('');
  const displayOutputBits = outputKey.split('');

  return (
    <div style={{
      background: 'linear-gradient(135deg, #020617 0%, #071210 50%, #020617 100%)',
      border: '1px solid #10b98130',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '420px',
      boxShadow: '0 0 60px rgba(16,185,129,0.06), inset 0 0 80px rgba(0,0,0,0.5)',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      {/* Animated Grid BG */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)',
        backgroundSize: '35px 35px',
        animation: 'paGridMove 25s linear infinite',
        pointerEvents: 'none'
      }}></div>

      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: '12px', right: '16px',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
        border: '1px solid #ef444430', color: '#fca5a5', fontSize: '0.78rem',
        padding: '7px 18px', borderRadius: '10px', cursor: 'pointer', zIndex: 20,
        backdropFilter: 'blur(10px)'
      }}>✕ Close</button>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '8px', position: 'relative', zIndex: 5 }}>
        <h2 style={{
          margin: 0, fontSize: '1.1rem', fontWeight: 700,
          background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '2px', textTransform: 'uppercase'
        }}>Privacy Amplification</h2>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
          Input: <strong style={{color:'#94a3b8'}}>{inputKey.length} bits</strong>
          {' → '}Output: <strong style={{color:'#34d399'}}>{outputKey.length} bits</strong>
          {isDone && <span style={{color:'#475569'}}>{' · '}{((1 - outputKey.length/inputKey.length)*100).toFixed(0)}% removed</span>}
        </div>
      </div>

      {/* Status */}
      <div style={{
        background: `linear-gradient(135deg, ${info.color}10, ${info.color}05)`,
        border: `1px solid ${info.color}25`,
        borderRadius: '14px',
        padding: '12px 18px',
        margin: '14px 0',
        display: 'flex', alignItems: 'center', gap: '10px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.4s ease',
        boxShadow: `0 0 20px ${info.color}08`
      }}>
        <span style={{ fontSize: '1.2rem' }}>{info.icon}</span>
        <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{info.text}</span>
      </div>

      {/* ===== MAIN VISUALIZATION ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 140px 1fr',
        gap: '16px',
        alignItems: 'center',
        minHeight: '250px',
        position: 'relative', zIndex: 5
      }}>

        {/* INPUT KEY */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontSize: '0.65rem', color: '#64748b', marginBottom: '8px',
            letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600
          }}>Corrected Key</div>
          <div style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid #1e293b',
            borderRadius: '14px',
            padding: '14px',
            width: '100%',
            display: 'flex', flexWrap: 'wrap', gap: '3px',
            justifyContent: 'center',
            minHeight: '80px',
            transition: 'all 0.3s',
            boxShadow: phase === 'feedBits' ? '0 0 20px rgba(56,189,248,0.08)' : 'none'
          }}>
            {displayInputBits.map((bit, i) => {
              const isFed = i < feedIdx;
              return (
                <div key={i} style={{
                  width: '20px', height: '20px', borderRadius: '4px',
                  background: isFed
                    ? `linear-gradient(135deg, ${bit === '1' ? '#7f1d1d' : '#1e3a5f'}, ${bit === '1' ? '#450a0a' : '#0c1929'})`
                    : `linear-gradient(135deg, ${bit === '1' ? '#dc2626' : '#2563eb'}, ${bit === '1' ? '#f87171' : '#60a5fa'})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.55rem', color: '#fff', fontWeight: 'bold',
                  opacity: isFed ? 0.3 : 1,
                  transition: 'all 0.15s ease',
                  transform: (i === feedIdx - 1 && phase === 'feedBits') ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: (i === feedIdx - 1 && phase === 'feedBits') ? '0 0 10px rgba(56,189,248,0.5)' : 'none'
                }}>
                  {bit}
                </div>
              );
            })}
            {inputKey.length > 40 && (
              <div style={{ fontSize: '0.55rem', color: '#475569', alignSelf: 'center' }}>+{inputKey.length - 40}</div>
            )}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '6px' }}>
            {inputKey.length} bits
          </div>
        </div>

        {/* HASH MACHINE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {/* Arrow In */}
          <div style={{
            fontSize: '1.2rem', color: '#10b981', marginBottom: '8px',
            opacity: phase === 'feedBits' ? 1 : 0.3,
            animation: phase === 'feedBits' ? 'paPulse 0.6s ease-in-out infinite' : 'none'
          }}>➜</div>

          {/* The Hash Machine */}
          <div style={{
            width: '100px', height: '100px',
            borderRadius: '16px',
            background: matrixGlow
              ? 'linear-gradient(135deg, #059669, #10b981)'
              : 'linear-gradient(135deg, #064e3b, #065f46)',
            border: `2px solid ${matrixGlow ? '#34d399' : '#10b98150'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            boxShadow: matrixGlow
              ? '0 0 40px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.2), inset 0 0 20px rgba(16,185,129,0.3)'
              : '0 5px 25px rgba(0,0,0,0.4)',
            transition: 'all 0.5s ease',
            animation: matrixGlow ? 'paHashSpin 1.5s ease-in-out' : 'none',
            overflow: 'hidden'
          }}>
            {/* Grid pattern */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
              opacity: 0.2
            }}>
              {Array(9).fill(0).map((_, i) => (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.15)' }}></div>
              ))}
            </div>
            {/* Label */}
            <div style={{
              fontWeight: 800, fontSize: '0.85rem',
              color: matrixGlow ? '#fff' : '#a7f3d0',
              textShadow: matrixGlow ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
              letterSpacing: '2px', zIndex: 2
            }}>HASH</div>
            {/* Progress ring */}
            {phase === 'hashing' && (
              <svg style={{ position: 'absolute', inset: '-4px', width: 'calc(100% + 8px)', height: 'calc(100% + 8px)' }}>
                <circle cx="54" cy="54" r="50" fill="none" stroke="#34d39940" strokeWidth="2" />
                <circle cx="54" cy="54" r="50" fill="none" stroke="#34d399" strokeWidth="2.5"
                  strokeDasharray={`${hashProgress * 3.14} ${314 - hashProgress * 3.14}`}
                  strokeLinecap="round"
                  transform="rotate(-90, 54, 54)"
                  style={{ transition: 'stroke-dasharray 0.1s linear' }}
                />
              </svg>
            )}
          </div>

          {/* Arrow Out */}
          <div style={{
            fontSize: '1.2rem', color: '#10b981', marginTop: '8px',
            opacity: phase === 'extracting' || phase === 'done' ? 1 : 0.3,
            animation: phase === 'extracting' ? 'paPulse 0.6s ease-in-out infinite' : 'none'
          }}>➜</div>

          {/* Floating particles */}
          {particles.slice(-5).map((p, idx) => (
            <div key={p.id} style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: p.bit === '1' ? '#ef4444' : '#3b82f6',
              boxShadow: `0 0 8px ${p.bit === '1' ? '#ef4444' : '#3b82f6'}`,
              animation: 'paParticleIn 0.4s ease-out forwards',
              animationDelay: `${idx * 50}ms`,
              opacity: 0
            }}></div>
          ))}
        </div>

        {/* OUTPUT KEY */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontSize: '0.65rem', color: '#64748b', marginBottom: '8px',
            letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600
          }}>Secret Key</div>
          <div style={{
            background: phase === 'done'
              ? 'linear-gradient(135deg, rgba(5,150,105,0.15), rgba(16,185,129,0.05))'
              : 'rgba(15,23,42,0.6)',
            border: phase === 'done' ? '1px solid #10b98140' : '1px solid #1e293b',
            borderRadius: '14px',
            padding: '14px',
            width: '100%',
            display: 'flex', flexWrap: 'wrap', gap: '4px',
            justifyContent: 'center',
            minHeight: '80px',
            transition: 'all 0.5s',
            boxShadow: phase === 'done' ? '0 0 30px rgba(16,185,129,0.1)' : 'none'
          }}>
            {displayOutputBits.map((bit, i) => {
              const isRevealed = i < outputIdx;
              return (
                <div key={i} style={{
                  width: '24px', height: '24px', borderRadius: '5px',
                  background: isRevealed
                    ? 'linear-gradient(135deg, #059669, #10b981)'
                    : '#0f172a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', color: '#fff', fontWeight: 'bold',
                  letterSpacing: '1px',
                  opacity: isRevealed ? 1 : 0.15,
                  transition: 'all 0.15s ease',
                  transform: (i === outputIdx - 1 && phase === 'extracting') ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: isRevealed
                    ? '0 0 8px rgba(16,185,129,0.3)'
                    : 'none',
                  border: isRevealed ? '1px solid #34d39940' : '1px solid #1e293b'
                }}>
                  {isRevealed ? bit : '?'}
                </div>
              );
            })}
            {!isDone && phase !== 'extracting' && (
              <div style={{ color: '#475569', fontSize: '0.7rem', fontStyle: 'italic', alignSelf: 'center' }}>
                Waiting...
              </div>
            )}
          </div>
          <div style={{
            fontSize: '0.65rem', marginTop: '6px',
            color: phase === 'done' ? '#34d399' : '#475569',
            fontWeight: phase === 'done' ? 600 : 400
          }}>
            {outputIdx}/{outputKey.length || '?'} bits
          </div>
        </div>
      </div>

      {/* Compression visual */}
      {phase === 'done' && isDone && (
        <div style={{
          textAlign: 'center', marginTop: '16px',
          animation: 'paFadeIn 0.5s ease',
          position: 'relative', zIndex: 5
        }}>
          <div style={{
            display: 'inline-flex', gap: '12px', alignItems: 'center',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid #10b98120',
            borderRadius: '12px',
            padding: '10px 20px'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              <strong>{inputKey.length}</strong> bits
            </span>
            <span style={{ color: '#10b981', fontSize: '1.1rem' }}>→</span>
            <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 700 }}>
              <strong>{outputKey.length}</strong> bits
            </span>
            <span style={{
              color: '#064e3b', fontSize: '0.65rem',
              background: '#10b98120', padding: '2px 8px', borderRadius: '6px'
            }}>
              🔒 Eve's info eliminated
            </span>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @keyframes paGridMove {
          from { transform: translateY(0); }
          to { transform: translateY(35px); }
        }
        @keyframes paPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
        @keyframes paHashSpin {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(5deg) scale(1.08); }
          50% { transform: rotate(-3deg) scale(1.05); }
          75% { transform: rotate(2deg) scale(1.08); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes paParticleIn {
          from { opacity: 1; transform: translateX(0) translateY(-50%); }
          to { opacity: 0; transform: translateX(50px) translateY(-50%); }
        }
        @keyframes paFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
