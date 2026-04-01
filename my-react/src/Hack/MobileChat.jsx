import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './MobileChat.css';

// Detect backend URL: use the current origin (works with ngrok and Vite proxy)
const BACKEND_URL = '';

function generateUserId() {
  return 'mob_' + Math.random().toString(36).substr(2, 9);
}

export default function MobileChat() {
  const { roomId } = useParams();
  const [userId] = useState(() => generateUserId());
  const [role, setRole] = useState(null);    // 'Alice' or 'Bob'
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [eveEnabled, setEveEnabled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const msgIndexRef = useRef(0);  // Track last seen message index
  const pollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join room on mount
  useEffect(() => {
    let cancelled = false;

    async function joinRoom() {
      try {
        const res = await fetch(`${BACKEND_URL}/join-room`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ room_id: roomId, user_id: userId, type: 'mobile' }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (cancelled) return;

        setRole(data.role);
        setConnected(true);
        setUserCount(data.user_count);
        setEveEnabled(data.eve);
        console.log(`[Mobile] Joined as ${data.role}`);
      } catch (err) {
        if (cancelled) return;
        console.error('[Mobile] Join failed:', err);
        if (err.message === 'Room not found') {
          setError('This QR code has expired or the server was restarted. Please click "Generate QR Code" on your computer to create a new one and scan it again.');
        } else {
          setError(
            `Error: ${err.message}\n\nCannot reach backend. Make sure the Flask server (port 5000), Vite server (port 5173), and ngrok are running correctly.`
          );
        }
      }
    }

    joinRoom();

    // Leave room on unmount
    return () => {
      cancelled = true;
      // fetch(`${BACKEND_URL}/leave-room`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ room_id: roomId, user_id: userId }),
      // }).catch(() => {});
    };
  }, [roomId, userId]);

  // Poll for messages
  const pollMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/room-messages/${roomId}?since=${msgIndexRef.current}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      if (!res.ok) return;

      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        const newMsgs = [];
        for (const msg of data.messages) {
          if (msg.type === 'user_connected') {
            newMsgs.push({ type: 'system', text: `${msg.role} has joined the chat` });
            setUserCount(msg.user_count);
          } else if (msg.type === 'user_disconnected') {
            newMsgs.push({ type: 'system', text: `${msg.role} has left the chat` });
            setUserCount(msg.user_count);
          } else if (msg.type === 'eve_intercepting') {
            newMsgs.push({
              type: 'eve_intercept',
              sender: msg.sender,
              qubitsIntercepted: msg.qubits_intercepted,
              qubitsCorrectBasis: msg.qubits_correct_basis,
              garbledPreview: msg.garbled_preview,
              qber: msg.qber,
            });
          } else if (msg.type === 'message_delivered') {
            setIsEncrypting(false);
            newMsgs.push({
              type: 'message',
              sender: msg.sender,
              text: msg.message,
              cipher: msg.cipher_text,
              timestamp: msg.timestamp,
            });
          } else if (msg.type === 'message_blocked') {
            setIsEncrypting(false);
            newMsgs.push({
              type: 'blocked',
              sender: msg.sender,
              reason: msg.reason,
              eveSaw: msg.eve_saw,
            });
          }
          // Ignore bb84_result and encryption_result (desktop-only)
        }
        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs]);
        }
        msgIndexRef.current = data.total;
      }
      // Update user count from the polling response
      if (data.user_count !== undefined) {
        setUserCount(data.user_count);
      }
    } catch (err) {
      // Silently ignore poll errors
    }
  }, [roomId]);

  // Start polling when connected
  useEffect(() => {
    if (!connected) return;

    pollRef.current = setInterval(pollMessages, 1500);
    return () => clearInterval(pollRef.current);
  }, [connected, pollMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || isEncrypting) return;
    const msg = inputText.trim();
    setInputText('');
    setIsEncrypting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          room_id: roomId,
          user_id: userId,
          message: msg,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send message');
        setIsEncrypting(false);
      }
      // Message results will come through polling
    } catch (err) {
      console.error('[Mobile] Send failed:', err);
      setIsEncrypting(false);
      setError('Failed to send message. Check your connection.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Error State
  if (error) {
    return (
      <div className="mchat-container">
        <div className="mchat-error">
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>❌</div>
          <h2 style={{ marginBottom: '10px' }}>Connection Error</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
            {error}
          </p>
          <button
            onClick={() => { setError(null); window.location.reload(); }}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff', border: 'none', padding: '10px 24px',
              borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer',
              marginTop: '15px',
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Connecting State
  if (!connected) {
    return (
      <div className="mchat-container">
        <div className="mchat-connecting">
          <div className="mchat-spinner"></div>
          <p>Connecting to room <strong>{roomId}</strong>...</p>
        </div>
      </div>
    );
  }

  const otherRole = role === 'Alice' ? 'Bob' : 'Alice';

  return (
    <div className="mchat-container">
      {/* Header */}
      <div className="mchat-header">
        <div className="mchat-header-left">
          <div className={`mchat-avatar ${role === 'Alice' ? 'alice' : 'bob'}`}>
            {role === 'Alice' ? '👩' : '👨'}
          </div>
          <div>
            <div className="mchat-header-title">
              BB84 Secure Chat
            </div>
            <div className="mchat-header-info">
              You are <strong style={{ color: role === 'Alice' ? '#f43f5e' : '#22c55e' }}>{role}</strong>
              {eveEnabled && <span className="mchat-eve-badge">🕵️ Eve Active</span>}
            </div>
          </div>
        </div>
        <div className="mchat-header-right">
          <div className={`mchat-status-dot ${userCount >= 2 ? 'online' : 'waiting'}`}></div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {userCount >= 2 ? `${otherRole} online` : `Waiting for ${otherRole}...`}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="mchat-messages">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="mchat-welcome">
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔐</div>
            <h3>Quantum-Encrypted Chat</h3>
            <p>Messages are encrypted using the BB84 quantum key distribution protocol.</p>
            {eveEnabled && (
              <p className="mchat-eve-warning">
                ⚠️ Eve is intercepting! Messages may be blocked.
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === 'system') {
            return (
              <div key={i} className="mchat-system-msg">
                {msg.text}
              </div>
            );
          }

          if (msg.type === 'eve_intercept') {
            const qubits = Array.from({ length: 40 }, (_, i) =>
              Math.random() > 0.45 ? 'intercept' : 'pass'
            );
            return (
              <div key={i} className="mchat-eve-intercept">
                <div className="mchat-eve-intercept-inner">
                  <div className="mchat-eve-intercept-header">
                    <span className="mchat-eve-spy-icon">🕵️</span>
                    <span className="mchat-eve-intercept-title">EVE INTERCEPTED</span>
                  </div>

                  {/* Live qubit stream */}
                  <div className="mchat-eve-qubit-stream">
                    <div className="mchat-eve-qubit-stream-inner">
                      {[...qubits, ...qubits].map((type, idx) => (
                        <span key={idx} className={type}>{type === 'intercept' ? '1' : '0'}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mchat-eve-intercept-body">
                    <div className="mchat-eve-stat-row">
                      <span>📡 Qubits intercepted</span>
                      <strong>{msg.qubitsIntercepted}</strong>
                    </div>
                    <div className="mchat-eve-stat-row">
                      <span>🎯 Correct basis guesses</span>
                      <strong>{msg.qubitsCorrectBasis}/{msg.qubitsIntercepted}</strong>
                    </div>
                    <div className="mchat-eve-stat-row">
                      <span>⚠️ Error rate (QBER)</span>
                      <strong style={{ color: msg.qber > 0.11 ? '#ef4444' : '#f59e0b' }}>
                        {(msg.qber * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                  <div className="mchat-eve-garbled">
                    <div className="mchat-eve-garbled-label">◈ WHAT EVE SEES</div>
                    <code className="mchat-eve-garbled-text">{msg.garbledPreview}</code>
                    <div className="mchat-eve-garbled-note">⚡ Quantum state disturbed — data unrecoverable</div>
                  </div>
                  {msg.qber > 0.11 && (
                    <div className="mchat-eve-detected-badge">
                      🚨 Alice &amp; Bob WILL detect this!
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (msg.type === 'blocked') {
            return (
              <div key={i} className="mchat-blocked-msg">
                <div className="mchat-blocked-icon">🚨</div>
                <div className="mchat-blocked-title">Eavesdropping Detected!</div>
                <div className="mchat-blocked-reason">{msg.reason}</div>
                <div className="mchat-blocked-eve">
                  🕵️ Eve intercepted: <code>{msg.eveSaw}</code>
                  <br />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    (garbled — cannot decrypt!)
                  </span>
                </div>
                <div className="mchat-blocked-footer">Message NOT delivered</div>
              </div>
            );
          }

          // Regular message
          const isMine = msg.sender === role;
          return (
            <div key={i} className={`mchat-bubble-row ${isMine ? 'sent' : 'received'}`}>
              <div className={`mchat-bubble ${isMine ? 'sent' : 'received'}`}>
                <div className="mchat-bubble-sender">
                  {msg.sender} {isMine ? '(You)' : ''}
                </div>
                <div className="mchat-bubble-text">{msg.text}</div>
                <div className="mchat-bubble-meta">
                  🔐 Encrypted • ✅ Delivered
                </div>
              </div>
            </div>
          );
        })}

        {/* Encrypting indicator */}
        {isEncrypting && (
          <div className="mchat-encrypting">
            <div className="mchat-encrypting-dots">
              <span></span><span></span><span></span>
            </div>
            <span>🔐 Running BB84 Protocol...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="mchat-input-bar">
        {userCount < 2 ? (
          <div className="mchat-input-waiting">
            Waiting for {otherRole} to join...
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder={`Type a message...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="mchat-input"
              disabled={isEncrypting}
            />
            <button
              className="mchat-send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || isEncrypting}
            >
              {isEncrypting ? '⏳' : '➤'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
