import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRLanding({ onStartSolo, onStartChat }) {
  const [eveOn, setEveOn] = useState(false);
  const [qrOn, setQrOn] = useState(false);
  const [numBits, setNumBits] = useState(200);
  const [roomId, setRoomId] = useState(null);
  const [localIp, setLocalIp] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Poll room status when QR is active
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/room-status/${roomId}`);
        const data = await res.json();
        setUserCount(data.user_count || 0);
      } catch (e) { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [roomId]);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eve: eveOn, numBits: numBits }),
      });
      const data = await res.json();
      setRoomId(data.room_id);
      setLocalIp(data.local_ip);
    } catch (e) {
      alert('Backend not reachable. Start the Flask server first.');
    }
    setIsCreating(false);
  };

  const handleStart = () => {
    if (qrOn && roomId) {
      onStartChat(roomId, eveOn, numBits);
    } else {
      onStartSolo(eveOn);
    }
  };

  const qrUrl = roomId && localIp
    ? `http://${localIp}:5173/chat/${roomId}`
    : '';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%)',
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #334155',
        borderRadius: '24px',
        padding: '50px 40px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Title */}
        <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>⚛️</div>
        <h1 style={{
          fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '1px',
        }}>
          BB84 Simulator
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '35px' }}>
          Quantum Key Distribution Protocol
        </p>

        {/* Toggle 1: Eve */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#0f172a', padding: '16px 20px', borderRadius: '12px',
          border: `1px solid ${eveOn ? '#ef4444' : '#334155'}`,
          marginBottom: '12px', transition: 'border-color 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🕵️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                Eavesdropper (Eve)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {eveOn ? 'Eve will intercept messages' : 'No interception — clean channel'}
              </div>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={eveOn} onChange={() => setEveOn(!eveOn)} />
            <span className="slider"></span>
          </label>
        </div>

        {/* Toggle 2: QR Chat */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#0f172a', padding: '16px 20px', borderRadius: '12px',
          border: `1px solid ${qrOn ? '#6366f1' : '#334155'}`,
          marginBottom: '30px', transition: 'border-color 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>📱</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                QR Code Chat
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {qrOn ? 'Scan QR to chat on mobile' : 'Solo simulator mode'}
              </div>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={qrOn} onChange={() => { setQrOn(!qrOn); setRoomId(null); setUserCount(0); }} />
            <span className="slider"></span>
          </label>
        </div>

        {/* QR Code Section */}
        {qrOn && (
          <div style={{
            background: '#0f172a', borderRadius: '16px', padding: '25px',
            border: '1px solid #334155', marginBottom: '25px',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            {!roomId ? (
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  color: '#fff', border: 'none', padding: '12px 30px',
                  borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
                  cursor: 'pointer', width: '100%',
                  opacity: isCreating ? 0.7 : 1,
                }}
              >
                {isCreating ? '⏳ Creating Room...' : '📡 Generate QR Code'}
              </button>
            ) : (
              <>
                {/* QR Code */}
                <div style={{
                  background: '#fff', padding: '20px', borderRadius: '12px',
                  display: 'inline-block', marginBottom: '15px',
                }}>
                  <QRCodeSVG value={qrUrl} size={180} level="H" />
                </div>

                {/* URL display */}
                <div style={{
                  fontSize: '0.7rem', color: '#64748b', wordBreak: 'break-all',
                  fontFamily: 'monospace', marginBottom: '15px',
                  background: '#1e293b', padding: '8px', borderRadius: '6px',
                }}>
                  {qrUrl}
                </div>

                {/* Connection Status */}
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: '30px',
                  marginBottom: '10px',
                }}>
                  {/* Alice */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '50%',
                      background: userCount >= 1 ? '#f43f5e' : '#334155',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem', margin: '0 auto 8px',
                      boxShadow: userCount >= 1 ? '0 0 15px rgba(244,63,94,0.5)' : 'none',
                      transition: 'all 0.5s ease',
                    }}>
                      {userCount >= 1 ? '👩' : '?'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      color: userCount >= 1 ? '#f43f5e' : '#64748b',
                    }}>
                      Alice {userCount >= 1 ? '✓' : ''}
                    </div>
                  </div>

                  {/* Bob */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '50%',
                      background: userCount >= 2 ? '#22c55e' : '#334155',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem', margin: '0 auto 8px',
                      boxShadow: userCount >= 2 ? '0 0 15px rgba(34,197,94,0.5)' : 'none',
                      transition: 'all 0.5s ease',
                    }}>
                      {userCount >= 2 ? '👨' : '?'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      color: userCount >= 2 ? '#22c55e' : '#64748b',
                    }}>
                      Bob {userCount >= 2 ? '✓' : ''}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {userCount === 0 && '⏳ Waiting for users to scan...'}
                  {userCount === 1 && '⏳ 1 user connected, waiting for second...'}
                  {userCount >= 2 && '✅ Both users connected!'}
                </div>
              </>
            )}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={qrOn && (!roomId || userCount < 2)}
          style={{
            width: '100%', padding: '15px',
            background: (qrOn && (!roomId || userCount < 2))
              ? '#334155'
              : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: (qrOn && (!roomId || userCount < 2))
              ? 'none'
              : '0 0 20px rgba(99,102,241,0.4)',
            transition: 'all 0.3s',
            opacity: (qrOn && (!roomId || userCount < 2)) ? 0.6 : 1,
          }}
        >
          {qrOn
            ? (userCount >= 2 ? '🚀 Begin Secure Chat' : '⏳ Waiting for Users...')
            : '▶ Start Simulator'}
        </button>

        {/* Mode summary */}
        <div style={{
          marginTop: '20px', fontSize: '0.75rem', color: '#475569',
          display: 'flex', justifyContent: 'center', gap: '15px',
        }}>
          <span>Eve: {eveOn ? '🔴 ON' : '⚪ OFF'}</span>
          <span>•</span>
          <span>Mode: {qrOn ? '📱 QR Chat' : '🖥️ Solo'}</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
