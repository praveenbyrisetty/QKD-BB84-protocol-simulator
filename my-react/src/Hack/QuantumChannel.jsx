import React from 'react';

export default function QuantumChannel({ isTransmitting, qubits }) {
  const getParticleVisual = (q) => {
    if (q.aliceBasis === '+') {
      return q.aliceBit === 0 ? "↑" : "→";
    } else {
      return q.aliceBit === 0 ? "↗" : "↖";
    }
  };

  // Optimization: Only render first 40 particles to keep animation smooth
  const visualQubits = qubits ? qubits.slice(0, 40) : [];
  
  const bitCount = visualQubits.length;
  const delayStep = bitCount > 20 ? 0.08 : 0.4; 
  const duration = bitCount > 20 ? '2s' : '4s';

  // --- SIMPLE STATION COMPONENT ---
  const SimpleStation = ({ name, color, side }) => (
    <div style={{
      position: 'absolute',
      [side]: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      textAlign: 'center'
    }}>
      {/* The Box */}
      <div style={{
        width: '60px', 
        height: '60px',
        background: '#0f172a',
        border: `2px solid ${color}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 15px ${color}30`,
        fontSize: '1.5rem'
      }}>
        {name === 'ALICE' ? 'A' : 'B'}
      </div>
      {/* The Label */}
      <div style={{
        marginTop: '8px',
        color: color,
        fontSize: '0.8rem',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>
        {name}
      </div>
    </div>
  );

  return (
    <div className="channel-container" style={{
      background: '#020617',
      border: '1px solid #1e293b',
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
      overflow: 'hidden', 
      position: 'relative', 
      height: '140px',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      borderRadius: '12px'
    }}>
      
      {/* 1. SIMPLE STATIONS */}
      <SimpleStation name="ALICE" color="#f43f5e" side="left" />
      <SimpleStation name="BOB" color="#22c55e" side="right" />

      {/* 2. Fiber Optic Line */}
      <div style={{
        position: 'absolute', 
        width: 'calc(100% - 160px)', /* Connect the two stations */
        height: '2px', 
        background: 'rgba(56, 189, 248, 0.2)', 
        top: '50%', 
        marginTop: '-1px', 
        zIndex: 1
      }}></div>
      
      {/* 3. Title Label */}
      <div style={{
        position: 'absolute', 
        top: '15px', 
        width: '100%', 
        textAlign: 'center', 
        fontSize: '0.7rem', 
        color: '#475569', 
        letterSpacing: '2px', 
        textTransform: 'uppercase', 
        fontFamily: 'monospace'
      }}>
        Quantum Channel
      </div>

      {/* 4. State: Offline vs Transmitting */}
      {!isTransmitting || !qubits || qubits.length === 0 ? (
         <div style={{
           zIndex: 5, 
           background: 'rgba(15, 23, 42, 0.8)', 
           padding: '6px 16px', 
           borderRadius: '20px', 
           border: '1px dashed #334155', 
           color: '#64748b', 
           fontSize: '0.8rem', 
           fontStyle: 'italic'
         }}>
           Ready to Transmit
         </div>
      ) : (
         visualQubits.map((q, i) => {
           const color = q.aliceBit === 1 ? '#ef4444' : '#3b82f6';
           const symbol = getParticleVisual(q);
           return (
             <div key={q.id} style={{
               position: 'absolute', 
               left: '-50px', /* Start off-screen left */
               top: '50%', 
               marginTop: '-15px',
               width: '30px', 
               height: '30px', 
               borderRadius: '50%',
               background: '#0f172a', 
               border: `2px solid ${color}`, 
               boxShadow: `0 0 10px ${color}`,
               color: color, 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               fontSize: '1rem', 
               fontWeight: 'bold', 
               zIndex: 10,
               
               /* The Travel Animation */
               animation: `photonTravel ${duration} linear infinite`, 
               animationDelay: `${i * delayStep}s` 
             }}>
               {symbol}
             </div>
           );
         })
      )}
    </div>
  );
}