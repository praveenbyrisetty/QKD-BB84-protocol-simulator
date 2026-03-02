import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import './index.css'; 

// Components
import Loader from './Hack/Loader'; 
import Header from './Hack/Header';
import QuantumChannel from './Hack/QuantumChannel';
import AlicePanel from './Hack/AlicePanel';
import BobPanel from './Hack/BobPanel';
import GraphPage from './Hack/GraphPage';
import Controls from './Hack/Controls';
import CascadePanel from './Hack/CascadePanel';
import PrivacyAmpPanel from './Hack/PrivacyAmpPanel';
import EncryptionPanel from './Hack/EncryptionPanel';
import FixedBubble from './Hack/FixedBubble'; 
import QuantumChannelExpanded from './Hack/QuantumChannelExpanded';
import CascadeExpanded from './Hack/CascadeExpanded';
import PrivacyAmpExpanded from './Hack/PrivacyAmpExpanded';
import EncryptionExpanded from './Hack/EncryptionExpanded';
import QRLanding from './Hack/QRLanding';
import EveOverlay from './Hack/EveOverlay';

const BACKEND_URL = ''; // Uses Vite proxy — all requests go through port 5173

function App() {
  // --- MODE ---
  const [mode, setMode] = useState('landing'); // 'landing' | 'solo' | 'qr-chat'
  const [chatRoomId, setChatRoomId] = useState(null);
  const [chatSocket, setChatSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // --- STATE ---
  const [qubits, setQubits] = useState([]); 
  const [isEveOn, setIsEveOn] = useState(false);
  const [step, setStep] = useState(0); 
  const [numBits, setNumBits] = useState(20); 
  const [isLoading, setIsLoading] = useState(false); 
  
  // Backend Data
  const [backendData, setBackendData] = useState(null);
  const [finalKey, setFinalKey] = useState("");
  const [errorRate, setErrorRate] = useState(0);
  const [isAborted, setIsAborted] = useState(false);
  const [correctedKey, setCorrectedKey] = useState("");
  const [channelExpanded, setChannelExpanded] = useState(false);
  const [cascadeExpanded, setCascadeExpanded] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [encryptionExpanded, setEncryptionExpanded] = useState(false);

  // INTERACTION STATE
  const [bubbleData, setBubbleData] = useState({ title: null, text: null, x: 0, y: 0 });
  const hoverTimer = useRef(null);

  // Chat-mode specific state
  const [chatCurrentMessage, setChatCurrentMessage] = useState('');
  const [chatSender, setChatSender] = useState('');
  const [chatCipher, setChatCipher] = useState('');
  const [chatDecrypted, setChatDecrypted] = useState('');
  
  // Eve overlay state
  const [eveOverlayData, setEveOverlayData] = useState(null);

  // --- SOCKET.IO FOR QR CHAT MODE ---
  useEffect(() => {
    if (mode !== 'qr-chat' || !chatRoomId) return;

    const s = io(BACKEND_URL, { transports: ['polling'] });
    setChatSocket(s);

    s.on('connect', () => {
      console.log('[Desktop] Connected to backend socket');
      s.emit('join_room', { room_id: chatRoomId, type: 'desktop' });
    });

    // When a mobile user sends a message, BB84 runs and we get results
    s.on('bb84_result', (data) => {
      console.log('[Desktop] BB84 result received for message:', data.message);
      setChatCurrentMessage(data.message);
      setChatSender(data.sender);
      if (data.num_qubits) setNumBits(data.num_qubits);
      
      // Populate BB84 data and animate through the steps
      const bb84 = data.bb84_data;
      setBackendData(bb84);
      
      const uiQubits = bb84.alice_bits.map((bit, i) => ({
        id: i,
        aliceBit: bit,
        aliceBasis: bb84.alice_bases[i],
        bobBasis: bb84.bob_bases[i],
        bobBit: bb84.bob_results[i],
      }));
      
      setQubits(uiQubits);
      setStep(1);

      // Auto-advance through steps with slower delays for visualization
      setTimeout(() => {
        setErrorRate(bb84.qber * 100);
        setStep(2);
      }, 4000);

      setTimeout(() => {
        if (bb84.aborted) setIsAborted(true);
        setCorrectedKey(bb84.alice_key ? bb84.alice_key.join('') : "");
        setStep(3);
      }, 8000);

      setTimeout(() => {
        if (!bb84.aborted) {
          setFinalKey(bb84.final_key.join(''));
          setStep(4);
        }
      }, 12000);
    });

    s.on('eve_intercepting', (data) => {
      setEveOverlayData(data);
    });

    s.on('encryption_result', (data) => {
      setChatCipher(data.cipher_text || '');
      setChatDecrypted(data.decrypted_message || '');
    });

    s.on('message_delivered', (data) => {
      setChatMessages(prev => [...prev, {
        type: 'delivered',
        sender: data.sender,
        message: data.message,
        cipher: data.cipher_text,
      }]);
    });

    s.on('message_blocked', (data) => {
      setChatMessages(prev => [...prev, {
        type: 'blocked',
        sender: data.sender,
        reason: data.reason,
        eveSaw: data.eve_saw,
      }]);
    });

    s.on('user_connected', (data) => {
      console.log(`[Desktop] ${data.role} connected (${data.user_count}/2)`);
    });

    return () => {
      s.disconnect();
    };
  }, [mode, chatRoomId]);

  // --- LANDING HANDLERS ---
  const handleStartSolo = (eveEnabled) => {
    setIsEveOn(eveEnabled);
    setMode('solo');
  };

  const handleStartChat = (roomId, eveEnabled, numBitsFromLanding) => {
    setIsEveOn(eveEnabled);
    setChatRoomId(roomId);
    if (numBitsFromLanding) setNumBits(numBitsFromLanding);
    setMode('qr-chat');
  };

  // --- SOLO MODE ACTIONS ---
  const handleTransmit = async () => {
    console.log('TRANSMIT clicked, numBits:', numBits, 'eve:', isEveOn);
    setIsLoading(true); setStep(0); setBackendData(null); setQubits([]); setIsAborted(false); setErrorRate(0); setFinalKey(""); setCorrectedKey("");
    try {
      const response = await fetch(`${BACKEND_URL}/bb84`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ n: numBits, eve: isEveOn }), });
      const data = await response.json();
      console.log('Backend response:', data);
      setBackendData(data);

      // Trigger the Eve overlay if Eve was active
      if (isEveOn && data.eve_bases) {
        const eveMatched = data.eve_bases.filter((b, i) => b === data.alice_bases[i]).length;
        const garbled = Array.from({ length: 8 }, () =>
          '0123456789ABCDEF'[Math.floor(Math.random() * 16)]
        ).join('');
        setEveOverlayData({
          qubits_intercepted: numBits,
          qubits_correct_basis: eveMatched,
          garbled_preview: garbled,
          qber: data.qber,
        });
      }

      const uiQubits = data.alice_bits.map((bit, i) => ({ id: i, aliceBit: bit, aliceBasis: data.alice_bases[i], bobBasis: data.bob_bases[i], bobBit: data.bob_results[i], }));
      setTimeout(() => { setQubits(uiQubits); setStep(1); setIsLoading(false); console.log('Step set to 1'); }, 1000);
    } catch (error) { console.error('FETCH ERROR:', error); alert("Backend Error"); setIsLoading(false); }
  };
  const handleSift = () => { console.log('SIFT clicked, backendData:', !!backendData); if(backendData) { setErrorRate(backendData.qber * 100); setStep(2); console.log('Step set to 2'); } };
  const handleCascade = () => { console.log('CASCADE clicked, backendData:', !!backendData, 'aborted:', backendData?.aborted); if(backendData) { if(backendData.aborted) setIsAborted(true); setCorrectedKey(backendData.alice_key ? backendData.alice_key.join('') : ""); setStep(3); console.log('Step set to 3'); } };
  const handlePrivacyAmp = () => { console.log('PRIVACY AMP clicked, isAborted:', isAborted, 'backendData:', !!backendData); if(!isAborted && backendData) { setFinalKey(backendData.final_key.join('')); setStep(4); console.log('Step set to 4'); } };
  const handleReset = () => { 
    console.log('RESET clicked'); 
    setQubits([]); setStep(0); setIsAborted(false); setFinalKey(""); setErrorRate(0); setBackendData(null); 
    setChannelExpanded(false); setCascadeExpanded(false); setPrivacyExpanded(false); setEncryptionExpanded(false); 
    setChatCurrentMessage(''); setChatSender(''); setChatMessages([]); setChatCipher(''); setChatDecrypted('');
  };

  // --- DYNAMIC HOVER LOGIC ---
  const hoverProps = (title, text) => ({
    onMouseEnter: (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => {
        setBubbleData({ title: title, text: text, x: clientX, y: clientY });
      }, 1000); 
    },
    onMouseLeave: () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      setBubbleData({ title: null, text: null, x: 0, y: 0 });
    },
    style: { 
      cursor: 'help',
      transition: 'all 0.3s ease',
      boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)'
    },
    onMouseOver: (e) => {
      e.currentTarget.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.4)';
      e.currentTarget.style.transform = 'scale(1.01)';
    },
    onMouseOut: (e) => {
      e.currentTarget.style.boxShadow = '0 0 0 0 rgba(99, 102, 241, 0)';
      e.currentTarget.style.transform = 'scale(1)';
    }
  });

  // --- RENDER LANDING ---
  if (mode === 'landing') {
    return <QRLanding onStartSolo={handleStartSolo} onStartChat={handleStartChat} />;
  }

  // --- RENDER SIMULATOR (Solo + QR-Chat) ---
  return (
    <div style={{minHeight: '100vh'}}>
      {isLoading && <Loader />}
      
      <Header isEveOn={isEveOn} setIsEveOn={setIsEveOn} step={step} onHelp={() => {}} />

      {/* QR Chat Mode Banner */}
      {mode === 'qr-chat' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(56,189,248,0.1))',
          borderBottom: '1px solid #6366f140',
          padding: '10px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.1rem' }}>📱</span>
            <span style={{ fontSize: '0.85rem', color: '#c7d2fe' }}>
              <strong>Live Chat Mode</strong> — Room: <code style={{ color: '#6366f1' }}>{chatRoomId}</code>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {chatCurrentMessage && (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                💬 {chatSender}: "{chatCurrentMessage}"
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chat Log (QR Mode) */}
      {mode === 'qr-chat' && chatMessages.length > 0 && (
        <div style={{
          maxWidth: '1280px', margin: '15px auto', padding: '0 20px',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: '12px', padding: '15px',
            border: '1px solid #334155', maxHeight: '200px', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px', fontWeight: 700 }}>
              📨 MESSAGE LOG
            </div>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                padding: '8px 12px', marginBottom: '6px', borderRadius: '8px',
                background: msg.type === 'delivered' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${msg.type === 'delivered' ? '#22c55e30' : '#ef444430'}`,
                fontSize: '0.85rem',
              }}>
                {msg.type === 'delivered' ? (
                  <span>
                    ✅ <strong>{msg.sender}</strong>: "{msg.message}"
                    <span style={{ color: '#f59e0b', fontSize: '0.7rem', marginLeft: '10px' }}>
                      Cipher: {msg.cipher}
                    </span>
                  </span>
                ) : (
                  <span>
                    🚨 <strong>{msg.sender}</strong> tried to send — <span style={{ color: '#ef4444' }}>BLOCKED</span>
                    <span style={{ fontSize: '0.7rem', marginLeft: '10px', color: '#f59e0b' }}>
                      Eve saw: {msg.eveSaw}
                    </span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="container">
        
        {/* CONFIG SECTION (Solo mode only) */}
        {mode === 'solo' && step === 0 && !isLoading && (
          <div className="config-panel" {...hoverProps('Configuration', 'Use the slider to set how many qubits Alice will send to Bob.')}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%', maxWidth:'500px'}}>
              <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginBottom:'10px'}}>
                <span className="config-label">Transmission Size:</span>
                <span style={{color:'#6366f1', fontWeight:'bold', fontFamily:'monospace', fontSize:'1.1rem'}}>{numBits} Qubits</span>
              </div>
              <div className="range-wrapper">
                <input type="range" min="10" max="500" value={numBits} onChange={(e) => setNumBits(parseInt(e.target.value))} className="custom-range"/>
              </div>
            </div>
          </div>
        )}

        <section>
          {channelExpanded ? (
            <QuantumChannelExpanded qubits={qubits} isEveOn={isEveOn} onClose={() => setChannelExpanded(false)} />
          ) : (
            <div {...hoverProps('Quantum Channel', 'The fiber optic cable where photons travel. Click to explore the equipment.')}>
              <QuantumChannel isTransmitting={step >= 1 && !isAborted} qubits={qubits} onExpand={() => setChannelExpanded(true)} />
            </div>
          )}
        </section>
        
        {/* ALICE & BOB PANELS - HIDDEN UNTIL TRANSMIT (step >= 1) */}
        {step >= 1 && (
          <section className="split-view" style={{marginBottom: '30px'}}>
             <div style={{height:'100%'}} {...hoverProps('Alice (The Sender)', 'Alice generates random bits and chooses random bases (+ or ×) to encode them as polarized photons. She sends these through the quantum channel to Bob.')}>
                <AlicePanel qubits={qubits} step={step} hoverProps={hoverProps} />
             </div>
             <div style={{height:'100%'}} {...hoverProps('Bob (The Receiver)', 'Bob independently picks random bases to measure the incoming photons. After sifting, only bits where his basis matched Alice\'s are kept as the raw key.')}>
                <BobPanel qubits={qubits} step={step} hoverProps={hoverProps} />
             </div>
          </section>
        )}

        {/* CASCADE & STATS */}
        {step >= 2 && (
          <section className={`stats-box ${isAborted ? 'aborted' : ''}`} {...(isAborted ? hoverProps('Protocol Aborted — Eve Detected', 'Eve must measure photons to eavesdrop, but this disturbs the quantum state and introduces errors. When the QBER exceeds ~11%, Alice and Bob detect the intrusion statistically and discard the compromised key.') : {})}>
             {isAborted ? (
                <div className="abort-container">
                  <div className="abort-icon">🚨</div>
                  <h2 className="abort-title">Protocol Aborted</h2>
                  <div className="abort-msg">Eavesdropper detected! Error Rate ({errorRate.toFixed(1)}%) too high.</div>
                  {mode === 'qr-chat' && (
                    <div style={{
                      background: 'rgba(239,68,68,0.15)', padding: '12px 20px', borderRadius: '10px',
                      border: '1px solid #ef444440', fontSize: '0.85rem', color: '#fca5a5', marginTop: '10px',
                    }}>
                      📱 Message from <strong>{chatSender}</strong> was <strong>NOT delivered</strong> to protect security.
                    </div>
                  )}
                </div>
             ) : (
                cascadeExpanded ? (
                  <CascadeExpanded siftedQubits={qubits} onClose={() => setCascadeExpanded(false)} />
                ) : (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', height:'420px'}}>
                  <div style={{height:'100%', cursor:'pointer'}} onClick={() => setCascadeExpanded(true)} {...hoverProps('Cascade Protocol', 'Alice and Bob split their sifted key into blocks and compare parity (even/odd). Click to see animated step-by-step!')}>
                     <CascadePanel siftedQubits={qubits} />
                  </div>
                  <div style={{height:'100%'}} {...hoverProps('QBER Graph', 'The blue line shows Alice\'s sifted key and the orange dashed line shows Bob\'s. Where the lines diverge, an error was introduced — usually by Eve\'s interception or channel noise.')}>
                     <GraphPage qubits={qubits} errorRate={errorRate} />
                  </div>
                </div>
                )
             )}
          </section>
        )}

        {/* PRIVACY AMP */}
        {step >= 3 && !isAborted && (
          <section>
            {privacyExpanded ? (
              <PrivacyAmpExpanded finalKey={step >= 4 ? backendData.final_key : ""} correctedKey={correctedKey} onClose={() => setPrivacyExpanded(false)} />
            ) : (
              <div style={{cursor:'pointer'}} onClick={() => setPrivacyExpanded(true)} {...hoverProps('Privacy Amplification', 'We shrink the key using a hash function to remove any partial info Eve stole. Click to see animated step-by-step!')}>
                <PrivacyAmpPanel finalKey={step >= 4 ? backendData.final_key : ""} correctedKey={correctedKey} />
              </div>
            )}
          </section>
        )}

        {/* ENCRYPTION */}
        {step >= 4 && !isAborted && (
          <section className="msg-area" style={{marginTop:'30px'}}>
            {mode === 'qr-chat' ? (
              /* QR Chat Mode: Show encryption/decryption of the actual chat message */
              <div>
                <h3 style={{textAlign:'center', color:'#6366f1', marginBottom:'20px'}}>🔐 Secure Messaging — Live Encryption</h3>
                <div style={{display:'flex', gap:'20px', alignItems:'stretch'}}>
                  {/* Original Message */}
                  <div className="panel" style={{flex:1, border:'1px solid #f43f5e', padding:'20px', borderRadius:'12px', background:'#1e293b'}}>
                    <h4 style={{color:'#f43f5e', margin:'0 0 10px 0', fontSize:'0.85rem'}}>📤 ORIGINAL MESSAGE ({chatSender})</h4>
                    <div style={{
                      background:'#0f172a', padding:'15px', borderRadius:'8px', border:'1px solid #334155',
                      fontSize:'1.1rem', color:'#fff', fontWeight:'bold', textAlign:'center', minHeight:'50px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {chatCurrentMessage || '...'}
                    </div>
                    <div style={{fontSize:'0.75rem', color:'#64748b', marginTop:'8px', textAlign:'center'}}>
                      {chatCurrentMessage.length * 8} bits
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                    <div style={{fontSize:'1.5rem', color:'#6366f1'}}>→</div>
                    <div style={{fontSize:'0.7rem', color:'#6366f1', fontWeight:700}}>XOR</div>
                    <div style={{fontSize:'1.5rem', color:'#6366f1'}}>→</div>
                  </div>

                  {/* Encrypted */}
                  <div className="panel" style={{flex:1, border:'1px solid #f59e0b', padding:'20px', borderRadius:'12px', background:'#1e293b'}}>
                    <h4 style={{color:'#f59e0b', margin:'0 0 10px 0', fontSize:'0.85rem'}}>🔒 ENCRYPTED (CIPHER TEXT)</h4>
                    <div style={{
                      background:'#0f172a', padding:'15px', borderRadius:'8px', border:'1px solid #f59e0b40',
                      fontSize:'1rem', color:'#f59e0b', fontFamily:'monospace', fontWeight:'bold',
                      wordBreak:'break-all', textAlign:'center', minHeight:'50px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {chatCipher || '⏳ Encrypting...'}
                    </div>
                    <div style={{fontSize:'0.7rem', color:'#64748b', marginTop:'8px', textAlign:'center'}}>
                      {isEveOn && '🕵️ Eve sees only this gibberish!'}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                    <div style={{fontSize:'1.5rem', color:'#22c55e'}}>→</div>
                    <div style={{fontSize:'0.7rem', color:'#22c55e', fontWeight:700}}>XOR</div>
                    <div style={{fontSize:'1.5rem', color:'#22c55e'}}>→</div>
                  </div>

                  {/* Decrypted */}
                  <div className="panel" style={{flex:1, border:'1px solid #22c55e', padding:'20px', borderRadius:'12px', background:'#1e293b'}}>
                    <h4 style={{color:'#22c55e', margin:'0 0 10px 0', fontSize:'0.85rem'}}>✅ DECRYPTED (BOB RECEIVES)</h4>
                    <div style={{
                      background:'#064e3b', padding:'15px', borderRadius:'8px', border:'1px solid #10b981',
                      fontSize:'1.1rem', color:'#34d399', fontWeight:'bold', textAlign:'center', minHeight:'50px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 0 15px rgba(16,185,129,0.2)',
                    }}>
                      {chatDecrypted || '⏳ Decrypting...'}
                    </div>
                    <div style={{fontSize:'0.75rem', color:'#22c55e', marginTop:'8px', textAlign:'center'}}>
                      ✅ Message delivered securely!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Solo mode: Show the interactive EncryptionPanel */
              encryptionExpanded ? (
                <EncryptionExpanded finalKey={backendData.final_key} onClose={() => setEncryptionExpanded(false)} />
              ) : (
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h3 style={{textAlign:'center', color:'#6366f1', margin: 0, flex:1}} {...hoverProps('Secure Messaging', 'Using the final Quantum Key as a One-Time Pad to encrypt messages. Click the info button to see how it works!')}>Secure Messaging</h3>
                    <button onClick={() => setEncryptionExpanded(true)} style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
                      border: '1px solid #6366f140', color: '#c7d2fe', fontSize: '0.7rem',
                      padding: '5px 14px', borderRadius: '8px', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>🔍 How It Works</button>
                  </div>
                  <EncryptionPanel finalKey={backendData.final_key} />
                </div>
              )
            )}
          </section>
        )}
      </main>

      {/* Solo mode controls */}
      {mode === 'solo' && (
        <Controls step={step} isAborted={isAborted} actions={{ handleTransmit, handleSift, handleCascade, handlePrivacyAmp, handleReset }} />
      )}

      {/* QR Chat mode: Reset button only */}
      {mode === 'qr-chat' && step > 0 && (
        <div className="sticky-footer">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔄 Auto-advancing through BB84 protocol...</span>
            <span style={{ color: step >= 4 ? '#22c55e' : '#6366f1' }}>
              Step {step}/4 {step >= 4 ? '✅' : ''}
            </span>
          </div>
          <button className="btn btn-danger" onClick={handleReset}>Reset</button>
        </div>
      )}
      
      {/* EVE INTERCEPTION OVERLAY */}
      {eveOverlayData && (
        <EveOverlay
          eveData={eveOverlayData}
          onDismiss={() => setEveOverlayData(null)}
        />
      )}

      {/* THE UNIVERSAL BUBBLE */}
      <FixedBubble 
        title={bubbleData.title} 
        text={bubbleData.text} 
        x={bubbleData.x} 
        y={bubbleData.y} 
        onClose={() => setBubbleData({ title: null, text: null, x: 0, y: 0 })}
      />

    </div>
  );
}

export default App;