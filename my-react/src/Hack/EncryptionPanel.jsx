import React, { useState, useEffect } from 'react';

export default function EncryptionPanel({ finalKey }) {
  const [msgInput, setMsgInput] = useState("");
  const [cipherText, setCipherText] = useState("");
  const [decryptedMsg, setDecryptedMsg] = useState("");
  const [error, setError] = useState("");
  
  // Calculate stats
  const keyLength = finalKey ? finalKey.length : 0;
  const msgBits = msgInput.length * 8; // 1 char = 8 bits
  const isTooLong = msgBits > keyLength;

  const handleEncrypt = async () => {
    if (!msgInput || !finalKey) return;
    setError(""); 
    setDecryptedMsg("");
    setCipherText("");

    try {
      const backendHost = window.location.hostname;
      const response = await fetch(`http://${backendHost}:5000/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgInput, key: finalKey })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error); // Show the specific security error
      } else {
        setCipherText(data.cipher_text);
      }
    } catch (e) {
      alert("Backend connection failed.");
    }
  };

  const handleDecrypt = async () => {
    if (!cipherText || !finalKey) return;

    try {
      const backendHost = window.location.hostname;
      const response = await fetch(`http://${backendHost}:5000/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cipherText: cipherText, key: finalKey })
      });

      const data = await response.json();
      setDecryptedMsg(data.decrypted_message);
    } catch (e) {
      alert("Decryption Failed");
    }
  };

  return (
    <div style={{display:'flex', gap:'20px', alignItems:'stretch'}}>
      
      {/* ALICE */}
      <div className="panel" style={{flex:1, border: '1px solid #f43f5e', padding:'20px', borderRadius:'12px', background:'#1e293b'}}>
        <h3 style={{color: '#f43f5e', marginTop:0, display:'flex', justifyContent:'space-between'}}>
          ALICE 
          <span style={{fontSize:'0.7rem', color:'#fff', background:'#334155', padding:'2px 8px', borderRadius:'4px'}}>
            KEY: {keyLength} bits
          </span>
        </h3>

        <textarea 
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder="Type secret message..." 
          style={{
            width:'100%', height:'80px', marginBottom:'10px', 
            background:'#0f172a', color:'#fff', border:'1px solid #334155', padding:'10px', boxSizing: 'border-box'
          }}
        />

        {/* Real-time Length Check */}
        <div style={{fontSize:'0.8rem', marginBottom:'15px', display:'flex', justifyContent:'space-between'}}>
           <span>Message Cost: <strong>{msgBits} bits</strong></span>
           <span style={{color: isTooLong ? '#f43f5e' : '#22c55e', fontWeight:'bold'}}>
             {isTooLong ? `Deficit: ${keyLength - msgBits}` : `Remaining: ${keyLength - msgBits}`}
           </span>
        </div>

        {error && (
          <div style={{
             background:'rgba(244, 63, 94, 0.2)', color:'#f43f5e', padding:'10px', 
             borderRadius:'6px', fontSize:'0.8rem', marginBottom:'10px', border:'1px solid #f43f5e'
          }}>
            🚫 {error}
          </div>
        )}

        <button 
          onClick={handleEncrypt} 
          disabled={isTooLong || !msgInput}
          style={{
            width:'100%', padding:'10px', 
            background: isTooLong ? '#334155' : '#f43f5e', 
            color: isTooLong ? '#94a3b8' : '#fff', 
            border:'none', borderRadius:'6px', cursor: isTooLong ? 'not-allowed' : 'pointer',
            fontWeight:'bold'
          }}
        >
          {isTooLong ? "NOT ENOUGH KEY" : "Encrypt (One-Time Pad)"}
        </button>
      </div>

      {/* BOB */}
      <div className="panel" style={{flex:1, border: '1px solid #22c55e', padding:'20px', borderRadius:'12px', background:'#1e293b'}}>
        <h3 style={{color: '#22c55e', marginTop:0}}>BOB</h3>
        
        {cipherText ? (
          <div style={{background:'#0f172a', padding:'10px', marginBottom:'10px', borderRadius:'6px', wordBreak:'break-all'}}>
             <div style={{fontSize:'0.7rem', color:'#f59e0b'}}>ENCRYPTED STREAM (HEX)</div>
             <div style={{fontFamily:'monospace', color:'#f59e0b', fontSize:'1.1rem'}}>{cipherText}</div>
          </div>
        ) : (
          <div style={{
            height: '60px', border:'1px dashed #334155', borderRadius:'6px', 
            display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'0.9rem'
          }}>
            Waiting for secure transmission...
          </div>
        )}

        <button 
          onClick={handleDecrypt} 
          disabled={!cipherText}
          style={{
            width:'100%', padding:'10px', background: cipherText ? '#22c55e' : '#334155', 
            color:'#fff', border:'none', borderRadius:'6px', cursor: cipherText ? 'pointer' : 'default', fontWeight:'bold'
          }}
        >
          Decrypt Message
        </button>

        {decryptedMsg && (
          <div style={{marginTop:'15px', textAlign:'center', animation: 'fadeIn 0.5s'}}>
            <div style={{fontSize:'0.8rem', color:'#22c55e', marginBottom:'5px'}}>DECRYPTED PLAINTEXT</div>
            <div style={{
              fontSize:'1.2rem', fontWeight:'bold', color:'#fff', 
              background:'#064e3b', padding:'10px', borderRadius:'6px', border:'1px solid #10b981'
            }}>
              {decryptedMsg}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}