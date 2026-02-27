import React, { useState, useEffect, useRef } from 'react';

export default function CascadeExpanded({ siftedQubits, onClose }) {
  const sifted = siftedQubits ? siftedQubits.filter(q => q.aliceBasis === q.bobBasis) : [];

  let errors = 0;
  sifted.forEach(q => { if (q.aliceBit !== q.bobBit) errors++; });
  const errorRate = sifted.length > 0 ? (errors / sifted.length) * 100 : 0;
  let k = 4;
  if (errorRate <= 1) k = 72;
  else if (errorRate <= 5) k = 14;
  else if (errorRate <= 10) k = 7;
  else k = 4;

  const allBlocks = [];
  for (let i = 0; i < sifted.length; i += k) {
    const data = sifted.slice(i, i + k);
    allBlocks.push({
      data,
      range: `${i+1}-${Math.min(i+k, sifted.length)}`,
      aliceParity: data.reduce((s, q) => s + q.aliceBit, 0) % 2,
      bobParity: data.reduce((s, q) => s + q.bobBit, 0) % 2,
      hasError: data.reduce((s, q) => s + q.aliceBit, 0) % 2 !== data.reduce((s, q) => s + q.bobBit, 0) % 2,
      errorIdx: data.findIndex(q => q.aliceBit !== q.bobBit)
    });
  }
  const blocks = allBlocks.slice(0, 6);

  const [currentBlock, setCurrentBlock] = useState(-1);
  const [phase, setPhase] = useState('intro');
  const [highlightBits, setHighlightBits] = useState([]);
  const [searchRange, setSearchRange] = useState(null);
  const [foundBit, setFoundBit] = useState(null);
  const [corrected, setCorrected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const animRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (blocks.length === 0 || paused) return;
    cancelledRef.current = false;

    const wait = (ms) => new Promise(resolve => {
      animRef.current = setTimeout(() => { if (!cancelledRef.current) resolve(); }, ms);
    });

    const runAnimation = async () => {
      setPhase('intro');
      setCurrentBlock(-1);
      setProgress(0);
      await wait(2000);
      if (cancelledRef.current) return;

      for (let b = 0; b < blocks.length; b++) {
        if (cancelledRef.current) return;
        const block = blocks[b];
        setCurrentBlock(b);
        setPhase('showBlock');
        setHighlightBits([]);
        setSearchRange(null);
        setFoundBit(null);
        setCorrected(false);
        setProgress(((b) / blocks.length) * 100);
        await wait(1200);
        if (cancelledRef.current) return;

        setPhase('calcParity');
        for (let i = 0; i < Math.min(block.data.length, 16); i++) {
          if (cancelledRef.current) return;
          setHighlightBits(prev => [...prev, i]);
          await wait(120);
        }
        await wait(500);
        if (cancelledRef.current) return;

        setPhase('parityResult');
        await wait(1500);
        if (cancelledRef.current) return;

        if (block.hasError && block.errorIdx >= 0) {
          setPhase('binarySearch');
          let lo = 0, hi = block.data.length - 1;
          for (let step = 0; step < 4 && lo < hi; step++) {
            if (cancelledRef.current) return;
            const mid = Math.floor((lo + hi) / 2);
            setSearchRange({ lo, hi, mid });
            await wait(900);
            if (cancelledRef.current) return;
            if (block.errorIdx <= mid) hi = mid; else lo = mid + 1;
          }

          setPhase('found');
          setFoundBit(block.errorIdx);
          setSearchRange(null);
          await wait(1200);
          if (cancelledRef.current) return;

          setPhase('correct');
          setCorrected(true);
          await wait(1500);
          if (cancelledRef.current) return;
        } else {
          await wait(500);
        }
        setProgress(((b + 1) / blocks.length) * 100);
      }

      setPhase('done');
      setProgress(100);
      await wait(3500);
      if (cancelledRef.current) return;
      setCurrentBlock(-1);
      setPhase('intro');
      setHighlightBits([]);
      setSearchRange(null);
      setFoundBit(null);
      setCorrected(false);
    };

    runAnimation();
    return () => {
      cancelledRef.current = true;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [blocks.length, paused]);

  const phaseInfo = () => {
    switch (phase) {
      case 'intro': return { icon: '🔗', text: 'Splitting key into blocks for error detection...', color: '#818cf8' };
      case 'showBlock': return { icon: '📦', text: `Inspecting Block ${currentBlock + 1} — Bits ${blocks[currentBlock]?.range}`, color: '#818cf8' };
      case 'calcParity': return { icon: '🔢', text: 'Calculating parity — counting 1s in each key...', color: '#38bdf8' };
      case 'parityResult': {
        const b = blocks[currentBlock];
        if (!b) return { icon: '', text: '', color: '#818cf8' };
        return b.hasError
          ? { icon: '⚠️', text: `Parity MISMATCH! Alice=${b.aliceParity} ≠ Bob=${b.bobParity} — Error detected!`, color: '#ef4444' }
          : { icon: '✅', text: `Parity MATCH — Alice=${b.aliceParity} = Bob=${b.bobParity} — Block is clean.`, color: '#10b981' };
      }
      case 'binarySearch': return { icon: '🔍', text: `Binary search: narrowing range [${searchRange?.lo+1}..${searchRange?.hi+1}]`, color: '#a78bfa' };
      case 'found': return { icon: '🎯', text: `Error located at bit position ${foundBit + 1}!`, color: '#eab308' };
      case 'correct': return { icon: '🔧', text: 'Flipping Bob\'s bit to match Alice — Error corrected!', color: '#10b981' };
      case 'done': return { icon: '🎉', text: 'Cascade complete — All blocks verified & corrected!', color: '#10b981' };
      default: return { icon: '', text: '', color: '#818cf8' };
    }
  };

  const info = phaseInfo();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #020617 0%, #0c1029 50%, #020617 100%)',
      border: '1px solid #6366f130',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '480px',
      boxShadow: '0 0 60px rgba(99,102,241,0.08), inset 0 0 80px rgba(0,0,0,0.5)',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none'
      }}></div>

      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px', position: 'relative', zIndex: 20 }}>
        <button onClick={() => setPaused(!paused)} style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
          border: '1px solid #6366f140',
          color: '#c7d2fe', fontSize: '0.78rem', padding: '7px 18px',
          borderRadius: '10px', cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s',
          letterSpacing: '0.5px'
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
          background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '2px', textTransform: 'uppercase'
        }}>Cascade Error Correction</h2>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
          Error Rate: <strong style={{color: errorRate > 0 ? '#ef4444' : '#10b981'}}>{errorRate.toFixed(1)}%</strong>
          {' · '}Block Size: <strong style={{color: '#c7d2fe'}}>{k}</strong>
          {' · '}<strong style={{color: '#c7d2fe'}}>{blocks.length}</strong> blocks
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '3px', borderRadius: '2px',
        background: 'rgba(99,102,241,0.1)',
        margin: '12px 0 16px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
          width: `${progress}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(99,102,241,0.5)'
        }}></div>
      </div>

      {/* STATUS CARD */}
      <div style={{
        background: `linear-gradient(135deg, ${info.color}10, ${info.color}05)`,
        border: `1px solid ${info.color}25`,
        borderRadius: '14px',
        padding: '14px 20px',
        marginBottom: '18px',
        display: 'flex', alignItems: 'center', gap: '12px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.4s ease',
        boxShadow: `0 0 20px ${info.color}08`
      }}>
        <span style={{ fontSize: '1.3rem' }}>{info.icon}</span>
        <span style={{
          fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 500,
          lineHeight: 1.4
        }}>{info.text}</span>
      </div>

      {/* BLOCKS */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '10px',
        maxHeight: '280px', overflowY: 'auto', paddingRight: '5px',
        position: 'relative', zIndex: 5
      }}>
        {blocks.map((block, bIdx) => {
          const isActive = bIdx === currentBlock;
          const isPast = bIdx < currentBlock;
          const isFuture = bIdx > currentBlock;
          const showParity = isActive && ['calcParity','parityResult','binarySearch','found','correct'].includes(phase);

          return (
            <div key={bIdx} style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))'
                : 'rgba(15,23,42,0.4)',
              border: isActive
                ? `1.5px solid ${block.hasError && ['parityResult','binarySearch','found','correct'].includes(phase) ? '#ef444480' : '#6366f180'}`
                : isPast
                  ? `1px solid ${block.hasError ? '#ef444430' : '#10b98130'}`
                  : '1px solid #1e293b40',
              borderRadius: '14px',
              padding: '16px 18px',
              opacity: isFuture ? 0.25 : 1,
              transition: 'all 0.5s ease',
              transform: isActive ? 'scale(1.01)' : 'scale(1)',
              boxShadow: isActive
                ? `0 0 30px ${block.hasError && phase !== 'showBlock' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.15)'}`
                : 'none',
              backdropFilter: isActive ? 'blur(5px)' : 'none'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '7px',
                    background: isActive ? 'linear-gradient(135deg, #6366f1, #818cf8)' : (isPast ? '#1e293b' : '#0f172a'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', color: '#fff', fontWeight: 'bold',
                    boxShadow: isActive ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
                    transition: 'all 0.3s'
                  }}>{bIdx + 1}</div>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>
                    Bits {block.range}
                  </span>
                </div>
                {(isPast || (isActive && ['parityResult','binarySearch','found','correct'].includes(phase))) && (
                  <div style={{
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.5px',
                    color: block.hasError ? '#fca5a5' : '#86efac',
                    padding: '3px 10px', borderRadius: '20px',
                    background: block.hasError ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                    border: `1px solid ${block.hasError ? '#ef444425' : '#10b98125'}`,
                    animation: isActive ? 'cascadeFadeIn 0.4s ease' : 'none'
                  }}>
                    {block.hasError
                      ? (isPast && corrected ? '✓ CORRECTED' : '⚡ ERROR')
                      : '✓ CLEAN'}
                  </div>
                )}
              </div>

              {/* Bits Grid */}
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {block.data.slice(0, 20).map((q, i) => {
                  const isHighlit = isActive && highlightBits.includes(i);
                  const isInRange = isActive && searchRange && i >= searchRange.lo && i <= searchRange.hi;
                  const isFound = isActive && foundBit === i;
                  const isCorrectedBit = isActive && corrected && foundBit === i;

                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', gap: '3px',
                      alignItems: 'center', position: 'relative'
                    }}>
                      {/* Alice */}
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: isHighlit
                          ? `linear-gradient(135deg, ${q.aliceBit === 1 ? '#dc2626' : '#2563eb'}, ${q.aliceBit === 1 ? '#f87171' : '#60a5fa'})`
                          : (q.aliceBit === 1 ? '#7f1d1d' : '#1e3a5f'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: '#fff', fontWeight: 'bold',
                        transition: 'all 0.15s ease',
                        transform: isHighlit ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: isFound ? '0 0 15px #eab308, 0 0 5px #eab30880'
                          : isInRange ? '0 0 10px #6366f150' : 'none',
                        border: isFound ? '2px solid #eab308'
                          : isInRange ? '1px solid #6366f180' : '1px solid transparent',
                        opacity: isActive ? (isHighlit ? 1 : 0.4) : (isPast ? 0.6 : 0.2)
                      }}>
                        {q.aliceBit}
                      </div>
                      {/* Bob */}
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: isCorrectedBit
                          ? `linear-gradient(135deg, #059669, #10b981)`
                          : isHighlit
                            ? `linear-gradient(135deg, ${q.bobBit === 1 ? '#dc2626' : '#2563eb'}, ${q.bobBit === 1 ? '#f87171' : '#60a5fa'})`
                            : (q.bobBit === 1 ? '#7f1d1d' : '#1e3a5f'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: '#fff', fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        border: (q.aliceBit !== q.bobBit && !isCorrectedBit) ? '1px solid #ef444480' : '1px solid transparent',
                        boxShadow: isFound ? '0 0 15px #ef444480'
                          : isCorrectedBit ? '0 0 12px #10b981, 0 0 4px #10b98180' : 'none',
                        opacity: isActive ? (isHighlit ? 0.85 : 0.3) : (isPast ? 0.5 : 0.2)
                      }}>
                        {isCorrectedBit ? q.aliceBit : q.bobBit}
                      </div>
                      {/* Labels on first bit of first block */}
                      {bIdx === 0 && i === 0 && (
                        <>
                          <div style={{
                            position: 'absolute', left: '-32px', top: '3px',
                            fontSize: '0.5rem', color: '#f43f5e', fontWeight: 600,
                            letterSpacing: '0.5px', whiteSpace: 'nowrap'
                          }}>Alice</div>
                          <div style={{
                            position: 'absolute', left: '-26px', top: '30px',
                            fontSize: '0.5rem', color: '#22c55e', fontWeight: 600,
                            letterSpacing: '0.5px', whiteSpace: 'nowrap'
                          }}>Bob</div>
                        </>
                      )}
                      {/* Error/correction markers */}
                      {isFound && !isCorrectedBit && (
                        <div style={{
                          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                          fontSize: '0.6rem', color: '#eab308',
                          animation: 'cascadePulse 0.7s ease-in-out infinite',
                          textShadow: '0 0 8px #eab30880'
                        }}>▼</div>
                      )}
                      {isCorrectedBit && (
                        <div style={{
                          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                          fontSize: '0.75rem', color: '#10b981',
                          animation: 'cascadeFadeIn 0.3s ease',
                          textShadow: '0 0 8px #10b98180'
                        }}>✓</div>
                      )}
                    </div>
                  );
                })}
                {block.data.length > 20 && (
                  <div style={{
                    fontSize: '0.6rem', color: '#475569', alignSelf: 'center',
                    marginLeft: '6px', fontStyle: 'italic'
                  }}>+{block.data.length - 20}</div>
                )}
              </div>

              {/* Parity Info */}
              {showParity && (
                <div style={{
                  display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center',
                  fontSize: '0.7rem', marginTop: '10px', padding: '8px 14px',
                  background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
                  animation: 'cascadeFadeIn 0.3s ease',
                  border: '1px solid #ffffff08'
                }}>
                  <span style={{ color: '#f43f5e' }}>
                    Alice: <strong style={{
                      background: 'rgba(244,63,94,0.15)', padding: '2px 6px', borderRadius: '4px'
                    }}>{block.aliceParity === 0 ? 'EVEN' : 'ODD'}</strong>
                  </span>
                  <span style={{
                    color: block.hasError ? '#ef4444' : '#10b981',
                    fontSize: '1rem', fontWeight: 'bold'
                  }}>{block.hasError ? '≠' : '='}</span>
                  <span style={{ color: '#22c55e' }}>
                    Bob: <strong style={{
                      background: 'rgba(34,197,94,0.15)', padding: '2px 6px', borderRadius: '4px'
                    }}>{block.bobParity === 0 ? 'EVEN' : 'ODD'}</strong>
                  </span>
                  {searchRange && (
                    <span style={{
                      color: '#a78bfa', marginLeft: '8px',
                      background: 'rgba(167,139,250,0.1)', padding: '2px 8px', borderRadius: '4px'
                    }}>
                      🔍 [{searchRange.lo + 1}..{searchRange.hi + 1}]
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CSS */}
      <style>{`
        @keyframes cascadePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes cascadeFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridMove {
          from { transform: translateY(0); }
          to { transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
}
