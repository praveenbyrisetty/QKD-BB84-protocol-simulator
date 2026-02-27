import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './MobileChat.css';

const BACKEND_URL = 'http://' + window.location.hostname + ':5000';

export default function MobileChat() {
  const { roomId } = useParams();
  const [socket, setSocket] = useState(null);
  const [role, setRole] = useState(null);    // 'Alice' or 'Bob'
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [eveEnabled, setEveEnabled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to backend
  useEffect(() => {
    const s = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => {
      console.log('[Mobile] Connected to backend');
      s.emit('join_room', { room_id: roomId });
    });

    s.on('room_joined', (data) => {
      setRole(data.role);
      setConnected(true);
      setUserCount(data.user_count);
      setEveEnabled(data.eve);
      console.log(`[Mobile] Joined as ${data.role}`);
    });

    s.on('user_connected', (data) => {
      setUserCount(data.user_count);
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${data.role} has joined the chat`,
      }]);
    });

    s.on('user_disconnected', (data) => {
      setUserCount(data.user_count);
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${data.role} has left the chat`,
      }]);
    });

    s.on('bb84_result', (data) => {
      setIsEncrypting(true);
    });

    s.on('message_delivered', (data) => {
      setIsEncrypting(false);
      setMessages(prev => [...prev, {
        type: 'message',
        sender: data.sender,
        text: data.message,
        cipher: data.cipher_text,
        timestamp: data.timestamp,
      }]);
    });

    s.on('message_blocked', (data) => {
      setIsEncrypting(false);
      setMessages(prev => [...prev, {
        type: 'blocked',
        sender: data.sender,
        reason: data.reason,
        eveSaw: data.eve_saw,
      }]);
    });

    s.on('error', (data) => {
      setError(data.message);
      setIsEncrypting(false);
    });

    return () => {
      s.disconnect();
    };
  }, [roomId]);

  const handleSend = () => {
    if (!inputText.trim() || !socket || isEncrypting) return;
    const msg = inputText.trim();
    setInputText('');
    setIsEncrypting(true);
    socket.emit('send_message', {
      room_id: roomId,
      message: msg,
    });
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
          <h2>Connection Error</h2>
          <p>{error}</p>
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
