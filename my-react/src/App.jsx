import React, { useState, useRef } from 'react';
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


function App() {
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

  // INTERACTION STATE
  const [bubbleData, setBubbleData] = useState({ title: null, text: null, x: 0, y: 0 });
  const hoverTimer = useRef(null);

  // --- ACTIONS ---
  const handleTransmit = async () => {
    setIsLoading(true); setStep(0); setBackendData(null); setQubits([]); setIsAborted(false); setErrorRate(0); setFinalKey(""); setCorrectedKey("");
    try {
      const response = await fetch('http://127.0.0.1:5000/bb84', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ n: numBits, eve: isEveOn }), });
      const data = await response.json();
      setBackendData(data);
      const uiQubits = data.alice_bits.map((bit, i) => ({ id: i, aliceBit: bit, aliceBasis: data.alice_bases[i], bobBasis: data.bob_bases[i], bobBit: data.bob_results[i], }));
      setTimeout(() => { setQubits(uiQubits); setStep(1); setIsLoading(false); }, 1000);
    } catch (error) { console.error(error); alert("Backend Error"); setIsLoading(false); }
  };
  const handleSift = () => { if(backendData) { setErrorRate(backendData.qber * 100); setStep(2); } };
  const handleCascade = () => { if(backendData) { if(backendData.aborted) setIsAborted(true); setCorrectedKey(backendData.alice_key ? backendData.alice_key.join('') : ""); setStep(3); } };
  const handlePrivacyAmp = () => { if(!isAborted && backendData) { setFinalKey(backendData.final_key.join('')); setStep(4); } };
  const handleReset = () => { setQubits([]); setStep(0); setIsAborted(false); setFinalKey(""); setErrorRate(0); setBackendData(null); };

  // --- NEW: DYNAMIC HOVER LOGIC ---
  const hoverProps = (title, text) => ({
    onMouseEnter: (e) => {
      e.persist();
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      // Wait 1 second before showing explanation
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

  // --- RENDER ---
  return (
    <div style={{minHeight: '100vh'}}>
      {isLoading && <Loader />}
      
      <Header isEveOn={isEveOn} setIsEveOn={setIsEveOn} step={step} onHelp={() => {}} />

      <main className="container">
        
        {/* <div style={{textAlign:'center', color:'#64748b', fontSize:'0.8rem', marginBottom:'10px', fontStyle:'italic'}}>
          (Hover for 3s to see details)
        </div> */}

        {/* CONFIG SECTION */}
        {step === 0 && !isLoading && (
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

        <section {...hoverProps('Quantum Channel', 'The fiber optic cable where photons travel. Eve may intercept them here.')}>
            <QuantumChannel isTransmitting={step >= 1 && !isAborted} qubits={qubits} />
        </section>
        
        {/* PASS hoverProps TO ALICE & BOB */}
        <section className="split-view" style={{marginBottom: '30px'}}>
           <div style={{height:'100%'}}>
              <AlicePanel qubits={qubits} step={step} hoverProps={hoverProps} />
           </div>
           <div style={{height:'100%'}}>
              <BobPanel qubits={qubits} step={step} hoverProps={hoverProps} />
           </div>
        </section>

        {/* CASCADE & STATS */}
        {step >= 2 && (
          <section className={`stats-box ${isAborted ? 'aborted' : ''}`}>
             {isAborted ? (
               <div className="abort-container">
                 <div className="abort-icon">🚨</div>
                 <h2 className="abort-title">Protocol Aborted</h2>
                 <div className="abort-msg">Eavesdropper detected! Error Rate ({errorRate.toFixed(1)}%) too high.</div>
               </div>
             ) : (
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', height:'420px'}}>
                 <div style={{height:'100%'}}>
                    <CascadePanel siftedQubits={qubits} />
                 </div>
                 <div style={{background:'rgba(15, 23, 42, 0.5)', borderRadius:'12px', border:'1px solid #334155', padding:'20px'}}>
                    <div style={{textAlign:'center', marginBottom:'10px'}}>QBER: {errorRate.toFixed(1)}%</div>
                    <GraphPage qubits={qubits} />
                 </div>
               </div>
             )}
          </section>
        )}

        {/* PRIVACY AMP */}
        {step >= 3 && !isAborted && (
          <section {...hoverProps('Privacy Amplification', 'We shrink the key using a hash function to remove any partial info Eve stole.')}>
             <PrivacyAmpPanel finalKey={step >= 4 ? backendData.final_key : ""} correctedKey={correctedKey} />
          </section>
        )}

        {/* ENCRYPTION */}
        {step >= 4 && !isAborted && (
          <section className="msg-area" style={{marginTop:'30px'}} {...hoverProps('Secure Messaging', 'Using the final Quantum Key as a One-Time Pad to encrypt messages.')}>
            <h3 style={{textAlign:'center', color:'#6366f1', marginBottom:'20px'}}>Secure Messaging</h3>
            <EncryptionPanel finalKey={backendData.final_key} />
          </section>
        )}
      </main>

      <Controls step={step} actions={{ handleTransmit, handleSift, handleCascade, handlePrivacyAmp, handleReset }} />
      
      {/* THE UNIVERSAL BUBBLE */}
      <FixedBubble 
        title={bubbleData.title} 
        text={bubbleData.text} 
        x={bubbleData.x} 
        y={bubbleData.y} 
      />


    </div>
  );
}

export default App;