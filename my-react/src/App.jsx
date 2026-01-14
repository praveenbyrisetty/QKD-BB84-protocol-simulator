import React, { useState } from 'react';
import './index.css'; 
import Loader from './Hack/Loader'; 

// Components
import Header from './Hack/Header';
import QuantumChannel from './Hack/QuantumChannel';
import AlicePanel from './Hack/AlicePanel';
import BobPanel from './Hack/BobPanel';
import GraphPage from './Hack/GraphPage';
import Controls from './Hack/Controls';
import CascadePanel from './Hack/CascadePanel';
import PrivacyAmpPanel from './Hack/PrivacyAmpPanel';
import EncryptionPanel from './Hack/EncryptionPanel'; 

function App() {
  const [qubits, setQubits] = useState([]); 
  const [isEveOn, setIsEveOn] = useState(false);
  const [step, setStep] = useState(0); 
  
  // DEFAULT CONFIG
  const [numBits, setNumBits] = useState(12); 
  const [isLoading, setIsLoading] = useState(false); 

  const [siftedKey, setSiftedKey] = useState("");
  const [correctedKey, setCorrectedKey] = useState("");
  const [finalKey, setFinalKey] = useState("");
  const [errorRate, setErrorRate] = useState(0);
  const [isAborted, setIsAborted] = useState(false);

  const handleTransmit = () => {
    setIsLoading(true);
    const delayTime = Math.min(1500 + (numBits * 5), 3000); 

    setTimeout(() => {
      const newQubits = [];
      const BASES = ['+', 'x'];
      const BITS = [0, 1];
      
      for (let i = 0; i < numBits; i++) {
        const aliceBasis = BASES[Math.floor(Math.random() * 2)];
        const aliceBit = BITS[Math.floor(Math.random() * 2)];
        let bobBasis = BASES[Math.floor(Math.random() * 2)];
        let bobBit = aliceBit;

        if (isEveOn) {
          if (Math.random() < 0.5) { 
             if (Math.random() < 0.5) bobBit = 1 - bobBit; 
          }
        }
        if (aliceBasis !== bobBasis) {
          bobBit = Math.floor(Math.random() * 2);
        }
        newQubits.push({ id: i, aliceBasis, aliceBit, bobBasis, bobBit });
      }

      setQubits(newQubits);
      setStep(1);
      setIsLoading(false);
    }, delayTime); 
  };

  const handleSift = () => {
    const match = qubits.filter(q => q.aliceBasis === q.bobBasis);
    let errors = 0;
    match.forEach(q => { if (q.aliceBit !== q.bobBit) errors++; });
    const rate = match.length > 0 ? (errors / match.length) * 100 : 0;
    setErrorRate(rate);
    const key = match.map(q => q.aliceBit).join('');
    setSiftedKey(key);
    setStep(2);
  };

  const handleCascade = () => {
    if (errorRate > 15) {
      setIsAborted(true);
      setStep(3);
      return; 
    }
    const match = qubits.filter(q => q.aliceBasis === q.bobBasis);
    const corrected = match.map(q => q.aliceBit).join('');
    setCorrectedKey(corrected);
    setStep(3);
  };

  const handlePrivacyAmp = () => {
    if (isAborted) return;
    const originalLen = correctedKey.length;
    const targetLen = Math.max(1, Math.floor(originalLen * 0.6));
    let mixedKey = "";
    const processLen = Math.min(targetLen, 2000); 
    
    for (let i = 0; i < processLen; i++) {
      let mixBlock = 0;
      for (let j = 0; j < originalLen; j+=Math.floor(originalLen/50) + 1) {
        if (correctedKey[j] === '1') mixBlock += (i + j); 
      }
      mixedKey += (mixBlock % 2).toString();
    }
    setFinalKey(mixedKey);
    setStep(4);
  };

  const handleReset = () => {
    setQubits([]); setStep(0); setIsAborted(false);
    setSiftedKey(""); setCorrectedKey(""); setFinalKey(""); 
    setErrorRate(0); 
  };

  return (
    <div>
      {isLoading && <Loader />}
      <Header isEveOn={isEveOn} setIsEveOn={setIsEveOn} step={step} />

      <main className="container">
        
        {step === 0 && !isLoading && (
          <div className="config-panel">
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%', maxWidth:'500px'}}>
              <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginBottom:'10px'}}>
                <span className="config-label">Transmission Size:</span>
                <span style={{color:'#6366f1', fontWeight:'bold', fontFamily:'monospace', fontSize:'1.1rem'}}>{numBits} Qubits</span>
              </div>
              <div className="range-wrapper">
                <input type="range" min="1" max="1000" value={numBits} onChange={(e) => setNumBits(parseInt(e.target.value))} className="custom-range"/>
                <div style={{display:'flex', justifyContent:'space-between', width:'100%', fontSize:'0.75rem', color:'#64748b', marginTop:'5px'}}><span>1</span><span>500</span><span>1000</span></div>
              </div>
            </div>
          </div>
        )}

        <section><QuantumChannel isTransmitting={step >= 1 && !isAborted} qubits={qubits} /></section>
        
        {/* UPDATED: Passing 'step' to AlicePanel now */}
        <section className="split-view">
           <AlicePanel qubits={qubits} step={step} />
           <BobPanel qubits={qubits} step={step} />
        </section>

        {step >= 2 && (
          <section className={`stats-box ${isAborted ? 'aborted' : ''}`}>
             {isAborted ? (
               <div className="abort-container">
                 <div className="abort-icon">🚨</div>
                 <h2 className="abort-title">Protocol Aborted</h2>
                 <div className="abort-msg">Eavesdropper detected! Error Rate ({errorRate.toFixed(1)}%) exceeds safety threshold.</div>
                 <div className="abort-badge">Connection Terminated. No Key Generated.</div>
                 <div className="graph-container-evidence" style={{marginTop:'30px', width:'100%', maxWidth:'900px'}}>
                   <h3 style={{fontSize:'0.9rem', color:'#94a3b8', marginBottom:'15px', textAlign:'center'}}>EVIDENCE: SIFTED KEY MISMATCH</h3>
                   <div style={{height: '350px'}}><GraphPage qubits={qubits} /></div>
                 </div>
               </div>
             ) : (
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', alignItems:'stretch', height:'420px'}}>
                 <div style={{height:'100%', minHeight:0}}><CascadePanel siftedQubits={qubits} /></div>
                 <div style={{background:'rgba(15, 23, 42, 0.5)', borderRadius:'12px', border:'1px solid #334155', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%'}}>
                    <div style={{background: '#0f172a', padding: '20px', borderBottom: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '5px'}}>
                      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
                        <div style={{color:'#94a3b8', fontSize:'0.9rem', fontWeight:'bold', letterSpacing:'1px'}}>BIT ERROR RATE (QBER)</div>
                        <div style={{fontSize:'2rem', fontWeight:'bold', color: errorRate > 0 ? '#ef4444' : '#10b981', lineHeight: '1'}}>{errorRate.toFixed(1)}%</div>
                      </div>
                      <div style={{alignSelf: 'flex-end', fontSize:'0.8rem', fontWeight:'bold', color: errorRate > 0 ? '#ef4444' : '#10b981', background: errorRate > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '4px', marginTop: '5px'}}>
                        STATUS: {errorRate < 15 ? 'SECURE (<15%)' : 'UNSECURE (>15%)'}
                      </div>
                    </div>
                    <div style={{padding:'20px', flex:1, minHeight:0}}><GraphPage qubits={qubits} /></div>
                 </div>
               </div>
             )}
          </section>
        )}

        {step >= 3 && !isAborted && (
          <section><PrivacyAmpPanel finalKey={step >= 4 ? finalKey : ""} correctedKey={correctedKey} /></section>
        )}

        {step >= 4 && !isAborted && (
          <section className="msg-area" style={{marginTop:'30px', textAlign:'left'}}>
            <h3 style={{color: 'var(--text-main)', textAlign:'center', marginBottom:'20px'}}><span style={{color:'#6366f1'}}>Secure Messaging</span> (Bitwise XOR)</h3>
            <EncryptionPanel finalKey={finalKey} />
          </section>
        )}
      </main>

      <Controls step={step} actions={{ handleTransmit, handleSift, handleCascade, handlePrivacyAmp, handleReset }} isAborted={isAborted} />
    </div>
  );
}

export default App;