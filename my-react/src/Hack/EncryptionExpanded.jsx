import React, { useState, useEffect, useRef } from 'react';

export default function EncryptionExpanded({ finalKey, onClose }) {
  const keyStr = (finalKey && typeof finalKey === 'object') ? finalKey.join('') : (finalKey || '');
  const keyLength = keyStr.length;

  // Demo state
  const [demoMsg, setDemoMsg] = useState('Hi');
  const [phase, setPhase] = useState('idle');
  // idle → toBinary → xorEncrypt → cipherReady → xorDecrypt → decrypted → done
  const [msgBits, setMsgBits] = useState([]);
  const [keyBits, setKeyBits] = useState([]);
  const [cipherBits, setCipherBits] = useState([]);
  const [decryptBits, setDecryptBits] = useState([]);
  const [xorIdx, setXorIdx] = useState(-1);
  const [decXorIdx, setDecXorIdx] = useState(-1);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const animRef = useRef(null);

  // Convert char to 8-bit binary array
  const charToBits = (ch) => {
    const code = ch.charCodeAt(0);
    return Array.from({length: 8}, (_, i) => (code >> (7 - i)) & 1);
  };

  const bitsToChar = (bits) => {
    const val = bits.reduce((acc, b, i) => acc + (b << (7 - i)), 0);
    return String.fromCharCode(val);
  };

  const startDemo = () => {
    if (!demoMsg || !keyStr) return;
    cancelledRef.current = false;
    setAutoPlaying(true);

    // Max chars we can encrypt
    const maxChars = Math.floor(keyLength / 8);
    const msg = demoMsg.slice(0, maxChars || 1);

    // Build bit arrays
    const mBits = [];
    msg.split('').forEach(ch => mBits.push(...charToBits(ch)));
    const kBits = keyStr.slice(0, mBits.length).split('').map(Number);
    const cBits = mBits.map((b, i) => b ^ kBits[i]);

    setMsgBits(mBits);
    setKeyBits(kBits);
    setCipherBits([]);
    setDecryptBits([]);
    setXorIdx(-1);
    setDecXorIdx(-1);

    const wait = (ms) => new Promise(resolve => {
      animRef.current = setTimeout(() => { if (!cancelledRef.current) resolve(); }, ms);
    });

    const run = async () => {
      // Step 1: Show binary
      setPhase('toBinary');
      await wait(2000);
      if (cancelledRef.current) return;

      // Step 2: XOR Encrypt bit by bit
      setPhase('xorEncrypt');
      for (let i = 0; i < mBits.length; i++) {
        if (cancelledRef.current) return;
        setXorIdx(i);
        setCipherBits(prev => [...prev, mBits[i] ^ kBits[i]]);
        await wait(200);
      }
      await wait(1000);
      if (cancelledRef.current) return;

      // Step 3: Cipher ready
      setPhase('cipherReady');
      await wait(2500);
      if (cancelledRef.current) return;

      // Step 4: XOR Decrypt bit by bit
      setPhase('xorDecrypt');
      for (let i = 0; i < cBits.length; i++) {
        if (cancelledRef.current) return;
        setDecXorIdx(i);
        setDecryptBits(prev => [...prev, cBits[i] ^ kBits[i]]);
        await wait(200);
      }
      await wait(1000);
      if (cancelledRef.current) return;

      // Step 5: Done
      setPhase('done');
      setAutoPlaying(false);
    };

    run();
  };

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const decryptedMsg = decryptBits.length > 0
    ? Array.from({length: Math.floor(decryptBits.length / 8)}, (_, i) =>
        bitsToChar(decryptBits.slice(i * 8, i * 8 + 8))
      ).join('')
    : '';

  const cipherHex = cipherBits.length > 0
    ? Array.from({length: Math.floor(cipherBits.length / 8)}, (_, i) => {
        const byte = cipherBits.slice(i * 8, i * 8 + 8).reduce((a, b, j) => a + (b << (7 - j)), 0);
        return byte.toString(16).toUpperCase().padStart(2, '0');
      }).join(' ')
    : '';

  const phaseColors = {
    idle: '#6366f1', toBinary: '#38bdf8', xorEncrypt: '#f43f5e',
    cipherReady: '#f59e0b', xorDecrypt: '#22c55e', done: '#10b981'
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #020617 0%, #0a0a1a 50%, #020617 100%)',
      border: '1px solid #6366f120',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 0 60px rgba(99,102,241,0.06), inset 0 0 80px rgba(0,0,0,0.5)',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      {/* Grid BG */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.02,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
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
      <div style={{ textAlign: 'center', marginBottom: '16px', position: 'relative', zIndex: 5 }}>
        <h2 style={{
          margin: 0, fontSize: '1.1rem', fontWeight: 700,
          background: 'linear-gradient(90deg, #6366f1, #818cf8, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '2px', textTransform: 'uppercase'
        }}>One-Time Pad Encryption</h2>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
          Quantum Key: <strong style={{color:'#818cf8'}}>{keyLength} bits</strong>
          {' · '}Max Message: <strong style={{color:'#94a3b8'}}>{Math.floor(keyLength/8)} chars</strong>
        </div>
      </div>

      {/* DEMO CONTROLS */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px', position: 'relative', zIndex: 5
      }}>
        <input
          type="text"
          value={demoMsg}
          onChange={e => setDemoMsg(e.target.value.slice(0, Math.floor(keyLength/8) || 4))}
          placeholder="Type message..."
          disabled={autoPlaying}
          style={{
            background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0',
            padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem',
            width: '180px', fontFamily: 'monospace',
            outline: 'none'
          }}
        />
        <button
          onClick={startDemo}
          disabled={autoPlaying || !demoMsg}
          style={{
            background: autoPlaying
              ? 'linear-gradient(135deg, #334155, #1e293b)'
              : 'linear-gradient(135deg, #6366f1, #818cf8)',
            border: 'none', color: '#fff', padding: '8px 20px',
            borderRadius: '10px', cursor: autoPlaying ? 'default' : 'pointer',
            fontSize: '0.8rem', fontWeight: 600,
            boxShadow: autoPlaying ? 'none' : '0 0 15px rgba(99,102,241,0.3)',
            transition: 'all 0.2s'
          }}
        >{autoPlaying ? '⏳ Running...' : '▶ Run Demo'}</button>
      </div>

      {/* ===== XOR VISUALIZATION ===== */}
      {phase !== 'idle' && (
        <div style={{
          background: 'rgba(15,23,42,0.4)',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid #1e293b',
          position: 'relative', zIndex: 5,
          marginBottom: '16px'
        }}>
          {/* Step label */}
          <div style={{
            textAlign: 'center', marginBottom: '14px',
            fontSize: '0.75rem', fontWeight: 600,
            color: phaseColors[phase] || '#818cf8',
            transition: 'color 0.3s'
          }}>
            {phase === 'toBinary' && '📄 Step 1: Converting message to binary (ASCII → 8-bit per character)'}
            {phase === 'xorEncrypt' && '🔐 Step 2: XOR each message bit with the quantum key'}
            {phase === 'cipherReady' && '📨 Step 3: Ciphertext ready — completely random to anyone without the key'}
            {phase === 'xorDecrypt' && '🔓 Step 4: Bob XORs ciphertext with the SAME key to decrypt'}
            {phase === 'done' && '✅ Complete! Original message recovered perfectly.'}
          </div>

          {/* Three rows: Message, Key, Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* ROW 1: Message Bits */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '70px', fontSize: '0.6rem', color: '#f43f5e',
                fontWeight: 600, textAlign: 'right', letterSpacing: '0.5px',
                flexShrink: 0
              }}>MESSAGE</div>
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                {msgBits.map((b, i) => (
                  <div key={i} style={{
                    width: '22px', height: '22px', borderRadius: '4px',
                    background: (phase === 'xorEncrypt' && i <= xorIdx)
                      ? '#7f1d1d50' : 'linear-gradient(135deg, #dc262680, #dc262640)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', color: '#fca5a5', fontWeight: 'bold',
                    border: (i === xorIdx && phase === 'xorEncrypt') ? '1.5px solid #f43f5e' : '1px solid #f43f5e20',
                    transition: 'all 0.15s',
                    opacity: (phase === 'xorEncrypt' && i <= xorIdx) ? 0.4 : 1
                  }}>{b}</div>
                ))}
                {/* Char labels */}
                {phase === 'toBinary' && demoMsg.split('').map((ch, ci) => (
                  <div key={`lbl-${ci}`} style={{
                    position: 'absolute', marginTop: '-18px',
                    marginLeft: `${76 + ci * (8 * 24 + 8)}px`,
                    fontSize: '0.55rem', color: '#f8717180',
                    animation: 'encFadeIn 0.3s ease'
                  }}>'{ch}'</div>
                ))}
              </div>
            </div>

            {/* XOR Symbol Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '70px', fontSize: '0.8rem', color: '#818cf8', textAlign: 'right', fontWeight: 'bold' }}>⊕</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontStyle: 'italic' }}>XOR (exclusive or)</div>
            </div>

            {/* ROW 2: Key Bits */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '70px', fontSize: '0.6rem', color: '#818cf8',
                fontWeight: 600, textAlign: 'right', letterSpacing: '0.5px',
                flexShrink: 0
              }}>KEY</div>
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                {keyBits.map((b, i) => (
                  <div key={i} style={{
                    width: '22px', height: '22px', borderRadius: '4px',
                    background: 'linear-gradient(135deg, #6366f180, #6366f140)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', color: '#c7d2fe', fontWeight: 'bold',
                    border: (i === xorIdx && phase === 'xorEncrypt') || (i === decXorIdx && phase === 'xorDecrypt')
                      ? '1.5px solid #818cf8' : '1px solid #6366f120',
                    transition: 'all 0.15s',
                    boxShadow: (i === xorIdx && phase === 'xorEncrypt') || (i === decXorIdx && phase === 'xorDecrypt')
                      ? '0 0 10px rgba(99,102,241,0.5)' : 'none'
                  }}>{b}</div>
                ))}
              </div>
            </div>

            {/* Equals */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '70px', fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>=</div>
              <div style={{
                height: '1px', flex: 1,
                background: 'linear-gradient(90deg, #334155, transparent)'
              }}></div>
            </div>

            {/* ROW 3: Cipher / Decrypted */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '70px', fontSize: '0.6rem',
                color: phase === 'xorDecrypt' || phase === 'done' ? '#22c55e' : '#f59e0b',
                fontWeight: 600, textAlign: 'right', letterSpacing: '0.5px',
                flexShrink: 0
              }}>{phase === 'xorDecrypt' || phase === 'done' ? 'DECRYPTED' : 'CIPHER'}</div>
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                {(phase === 'xorDecrypt' || phase === 'done' ? 
                  cipherBits.map((b, i) => {
                    const dec = i < decryptBits.length ? decryptBits[i] : null;
                    return (
                      <div key={i} style={{
                        width: '22px', height: '22px', borderRadius: '4px',
                        background: dec !== null
                          ? 'linear-gradient(135deg, #05966980, #10b98180)'
                          : 'linear-gradient(135deg, #f59e0b40, #f59e0b20)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: dec !== null ? '#86efac' : '#fcd34d',
                        fontWeight: 'bold',
                        border: i === decXorIdx ? '1.5px solid #22c55e' : '1px solid transparent',
                        transition: 'all 0.15s',
                        boxShadow: dec !== null ? '0 0 6px rgba(16,185,129,0.3)' : 'none'
                      }}>{dec !== null ? dec : b}</div>
                    );
                  })
                  :
                  cipherBits.map((b, i) => (
                    <div key={i} style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      background: 'linear-gradient(135deg, #f59e0b60, #f59e0b30)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', color: '#fcd34d', fontWeight: 'bold',
                      border: i === xorIdx ? '1.5px solid #f59e0b' : '1px solid #f59e0b20',
                      transition: 'all 0.15s',
                      animation: 'encFadeIn 0.15s ease'
                    }}>{b}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Result text */}
          {phase === 'cipherReady' && cipherHex && (
            <div style={{
              textAlign: 'center', marginTop: '14px',
              animation: 'encFadeIn 0.4s ease'
            }}>
              <div style={{ fontSize: '0.6rem', color: '#f59e0b', marginBottom: '4px', letterSpacing: '1px' }}>CIPHERTEXT (HEX)</div>
              <div style={{
                fontFamily: 'monospace', color: '#f59e0b', fontSize: '1.1rem',
                background: '#f59e0b10', padding: '6px 14px', borderRadius: '8px',
                display: 'inline-block', border: '1px solid #f59e0b20'
              }}>{cipherHex}</div>
            </div>
          )}
          {phase === 'done' && decryptedMsg && (
            <div style={{
              textAlign: 'center', marginTop: '14px',
              animation: 'encFadeIn 0.4s ease'
            }}>
              <div style={{ fontSize: '0.6rem', color: '#22c55e', marginBottom: '4px', letterSpacing: '1px' }}>DECRYPTED MESSAGE</div>
              <div style={{
                fontFamily: 'monospace', color: '#22c55e', fontSize: '1.3rem', fontWeight: 700,
                background: '#10b98115', padding: '8px 18px', borderRadius: '8px',
                display: 'inline-block', border: '1px solid #10b98130',
                boxShadow: '0 0 20px rgba(16,185,129,0.1)'
              }}>"{decryptedMsg}"</div>
            </div>
          )}
        </div>
      )}

      {/* ===== SECURITY EXPLANATION ===== */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px', position: 'relative', zIndex: 5
      }}>
        {/* Card 1 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))',
          border: '1px solid #10b98118',
          borderRadius: '14px', padding: '16px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🛡️</div>
          <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
            INFORMATION-THEORETIC SECURITY
          </div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Unlike AES or RSA, the One-Time Pad is <strong style={{color:'#e2e8f0'}}>mathematically unbreakable</strong> — not by brute force, not by quantum computers, not by any future algorithm. Ever.
          </div>
        </div>

        {/* Card 2 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))',
          border: '1px solid #6366f118',
          borderRadius: '14px', padding: '16px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⊕</div>
          <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
            WHY XOR WORKS
          </div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.5 }}>
            XOR with a <strong style={{color:'#e2e8f0'}}>truly random key</strong> produces perfectly random ciphertext. Every possible plaintext is equally likely — an attacker gains <strong style={{color:'#e2e8f0'}}>zero information</strong>.
          </div>
        </div>

        {/* Card 3 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(244,63,94,0.02))',
          border: '1px solid #f43f5e18',
          borderRadius: '14px', padding: '16px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔑</div>
          <div style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
            QUANTUM KEY = PERFECT KEY
          </div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.5 }}>
            BB84 + Cascade + Privacy Amp produces a key that is <strong style={{color:'#e2e8f0'}}>guaranteed random</strong> and <strong style={{color:'#e2e8f0'}}>known only to Alice & Bob</strong> — satisfying all OTP requirements.
          </div>
        </div>
      </div>

      {/* Security meter */}
      <div style={{
        marginTop: '14px', textAlign: 'center',
        position: 'relative', zIndex: 5
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          background: 'rgba(16,185,129,0.06)', border: '1px solid #10b98115',
          borderRadius: '12px', padding: '8px 20px'
        }}>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Security Level:</span>
          <div style={{
            width: '120px', height: '6px', borderRadius: '3px',
            background: '#1e293b', overflow: 'hidden'
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '3px',
              background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
              boxShadow: '0 0 8px rgba(16,185,129,0.5)'
            }}></div>
          </div>
          <span style={{
            fontSize: '0.7rem', color: '#34d399', fontWeight: 700,
            letterSpacing: '1px'
          }}>MAXIMUM</span>
          <span style={{ fontSize: '0.55rem', color: '#475569' }}>
            (Proven by Claude Shannon, 1949)
          </span>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @keyframes encFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
