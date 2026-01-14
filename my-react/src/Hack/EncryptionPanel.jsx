import React, { useState, useEffect } from 'react';

export default function EncryptionPanel({ finalKey }) {
  const [msgInput, setMsgInput] = useState("");
  const [cipherText, setCipherText] = useState(""); // Hex format
  const [decryptedMsg, setDecryptedMsg] = useState("");
  const [iv, setIv] = useState(null); // Initialization Vector
  const [cryptoKey, setCryptoKey] = useState(null);

  // --- CRYPTO HELPERS (Browser Native AES-GCM) ---
  
  // 1. Convert our Quantum Key (Binary String) into a valid AES-256 Key
  // We hash the bit string with SHA-256 to stretch it to exactly 32 bytes (256 bits)
  const generateKey = async (binaryString) => {
    if (!binaryString) return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(binaryString);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    
    return window.crypto.subtle.importKey(
      "raw", 
      hash, 
      { name: "AES-GCM" }, 
      false, 
      ["encrypt", "decrypt"]
    );
  };

  const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const hexToBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  };

  useEffect(() => {
    // Whenever the finalKey changes, regenerate the AES Key
    if (finalKey) {
      generateKey(finalKey).then(k => setCryptoKey(k));
    }
    // Reset states
    setMsgInput(""); setCipherText(""); setDecryptedMsg(""); setIv(null);
  }, [finalKey]);


  const handleEncrypt = async () => {
    if (!msgInput || !cryptoKey) return;
    setDecryptedMsg(""); 

    // Generate random IV (Initialization Vector) - standard for AES
    const newIv = window.crypto.getRandomValues(new Uint8Array(12));
    setIv(newIv);

    const encoder = new TextEncoder();
    const encodedMsg = encoder.encode(msgInput);

    // ENCRYPT
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: newIv },
      cryptoKey,
      encodedMsg
    );

    setCipherText(bufferToHex(encryptedBuffer));
  };

  const handleDecrypt = async () => {
    if (!cipherText || !cryptoKey || !iv) return;

    try {
      const encryptedBuffer = hexToBuffer(cipherText);

      // DECRYPT
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      setDecryptedMsg(decoder.decode(decryptedBuffer));
    } catch (e) {
      alert("Decryption Failed! Key mismatch or corrupted data.");
    }
  };

  const codeBoxStyle = {
    fontFamily: 'monospace',
    letterSpacing: '1px',
    wordBreak: 'break-all', 
    lineHeight: '1.5',
    fontSize: '0.85rem'
  };

  return (
    <div className="split-view" style={{alignItems: 'stretch'}}>
      
      {/* --- ALICE SIDE --- */}
      <div className="panel" style={{border: '1px solid #f43f5e', display:'flex', flexDirection:'column'}}>
        <div className="panel-title" style={{color: '#f43f5e', textAlign:'left', display:'flex', justifyContent:'space-between'}}>
          <span>ALICE (Encrypt)</span>
          <span style={{fontSize:'0.7rem', color:'#fff', background:'#f43f5e', padding:'2px 8px', borderRadius:'4px', fontWeight:'bold'}}>
             AES-256-GCM
          </span>
        </div>
        
        <div style={{marginBottom:'10px', fontSize:'0.8rem', color:'#94a3b8'}}>
           Algorithm: <span style={{color:'#fff'}}>Advanced Encryption Standard</span>
           <br/>
           Key Source: <span style={{color:'#f43f5e'}}>Quantum Derived (SHA-256 Hash)</span>
        </div>

        <textarea 
          className="input-field" 
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder="Type a secret message..." 
          style={{marginBottom:'10px', height:'80px', resize:'none'}}
        />

        {msgInput && cipherText && (
          <div style={{background:'#0f172a', padding:'15px', borderRadius:'8px', marginTop:'10px'}}>
             <div style={{fontSize:'0.7rem', color:'#f59e0b', marginBottom:'2px', fontWeight:'bold'}}>ENCRYPTED HEX OUTPUT</div>
             <div style={{...codeBoxStyle, color:'#f59e0b'}}>{cipherText}</div>
             <div style={{fontSize:'0.65rem', color:'#64748b', marginTop:'5px'}}>IV: {iv ? bufferToHex(iv) : ''}</div>
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{width:'100%', marginTop:'auto', paddingTop:'12px'}} 
          onClick={handleEncrypt}
          disabled={!msgInput || !finalKey}
        >
          🔒 Encrypt with AES
        </button>
      </div>

      {/* --- BOB SIDE --- */}
      <div className="panel" style={{border: '1px solid #22c55e', opacity: cipherText ? 1 : 0.5, display:'flex', flexDirection:'column'}}>
         <div className="panel-title" style={{color: '#22c55e', textAlign:'left'}}>BOB (Decrypt)</div>
         
         {!cipherText ? (
           <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontStyle:'italic'}}>
             Waiting for encrypted data...
           </div>
         ) : (
           <>
             <div style={{background:'#0f172a', padding:'15px', borderRadius:'8px', marginTop:'10px', flex:1}}>
                <div style={{marginBottom:'10px'}}>
                   <div style={{fontSize:'0.7rem', color:'#f59e0b', marginBottom:'2px'}}>RECEIVED CIPHERTEXT</div>
                   <div style={{...codeBoxStyle, color:'#f59e0b'}}>{cipherText}</div>
                </div>

                <div style={{borderTop:'1px solid #334155', paddingTop:'10px'}}>
                   <div style={{fontSize:'0.7rem', color:'#10b981', marginBottom:'2px'}}>KEY STATUS</div>
                   <div style={{fontSize:'0.8rem', color:'#10b981', display:'flex', alignItems:'center', gap:'6px'}}>
                     <span style={{fontSize:'1.2rem'}}>🔑</span> Quantum Key Synced
                   </div>
                </div>
             </div>

             <button className="btn" style={{width:'100%', background:'#334155', color:'#fff', margin:'15px 0'}} onClick={handleDecrypt}>
               🔓 Decrypt Message
             </button>

             {decryptedMsg && (
               <div style={{textAlign:'center', background:'rgba(34, 197, 94, 0.1)', padding:'15px', borderRadius:'8px', border:'1px solid #22c55e'}}>
                 <div style={{fontSize:'0.7rem', color:'#22c55e', textTransform:'uppercase'}}>Decrypted Text</div>
                 <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'#fff', marginTop:'5px', wordBreak:'break-word'}}>
                   "{decryptedMsg}"
                 </div>
               </div>
             )}
           </>
         )}
      </div>

    </div>
  );
}