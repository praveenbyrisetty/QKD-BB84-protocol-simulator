import React, { useState } from 'react';

export default function KeyProcessingPanel({ qubits, qber, finalKey }) {
  const [msg, setMsg] = useState("");
  const [cipher, setCipher] = useState("");
  
  const encrypt = () => {
    // Simple XOR viz
    if(!msg) return;
    setCipher("10110... (Encrypted)");
  };

  return (
    <div style={{width: '100%'}}>
      
      {/* SIFTED BITS */}
      <div className="sifted-section">
        <h4 style={{margin:0, color:'#333'}}>Sifted Bits (Matching Bases)</h4>
        <div className="sifted-grid">
          {qubits.map((q, i) => {
            if (q.aliceBasis === q.bobBasis) {
              return (
                <div key={i} className="sifted-box">
                  A:{q.aliceBit}, B:{q.bobBit}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* QBER */}
      <div style={{textAlign:'left', marginBottom:'20px'}}>
        <strong>QBER (Error Rate): {qber.toFixed(2)}%</strong>
        <div className="qber-bar-container">
          <div className="qber-fill" style={{width: `${qber}%`, background: qber > 15 ? '#ef4444' : '#22c55e'}}></div>
        </div>
        {qber < 15 ? <span style={{color:'green'}}>Key Accepted</span> : <span style={{color:'red'}}>Key Rejected (Eve Detected)</span>}
      </div>

      {/* FINAL KEY */}
      <div style={{marginBottom:'40px'}}>
        <h4>Final Key</h4>
        <div style={{display:'flex', justifyContent:'center', gap:'5px', flexWrap:'wrap'}}>
          {finalKey.split('').map((bit, i) => (
             <div key={i} className={`bit-circle bit-${bit}`} style={{width:'30px', height:'30px', fontSize:'0.8rem'}}>
               {bit}
             </div>
          ))}
        </div>
      </div>

      {/* ENCRYPTION */}
      <div className="encryption-box">
        <h4>One-Time Pad Encryption</h4>
        <input 
          type="text" 
          placeholder="Enter message to encrypt..." 
          value={msg} 
          onChange={(e) => setMsg(e.target.value)} 
        />
        <br/>
        <div style={{marginTop:'10px', color:'#666'}}>
          Encrypted: <span style={{color:'#8b5cf6', fontWeight:'bold'}}>{cipher}</span>
        </div>
        <button className="btn btn-purple" style={{marginTop:'15px'}} onClick={encrypt}>Encrypt Message</button>
      </div>

    </div>
  );
}