import React from 'react';

export default function QubitLog({ qubits, step }) {
  if (qubits.length === 0) return (
    <>
      <div className="panel-card alice-panel" style={{display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>Alice's Panel</div>
      <div className="panel-card bob-panel" style={{display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>Bob's Panel</div>
    </>
  );

  return (
    <>
      {/* ALICE PANEL */}
      <div className="panel-card alice-panel">
        <div className="panel-header" style={{color: '#be185d'}}>Alice</div>
        <div className="qubit-grid">
          {qubits.map((q) => (
            <div key={q.id} className="bit-card">
              <div className={`bit-circle ${q.aliceBit === 1 ? 'bg-1' : 'bg-0'}`}>{q.aliceBit}</div>
              <div style={{fontWeight:'bold'}}>{q.aliceBasis}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BOB PANEL */}
      <div className="panel-card bob-panel">
        <div className="panel-header" style={{color: '#15803d'}}>Bob</div>
        <div className="qubit-grid">
           {qubits.map((q) => {
             // Logic: Only show matching bits in color if step >= 2 (Sifting)
             const isMatch = q.aliceBasis === q.bobBasis;
             const showColor = step >= 2 && isMatch;
             
             return (
               <div key={q.id} className="bit-card" style={{opacity: step >= 2 && !isMatch ? 0.3 : 1}}>
                 <div className={`bit-circle`} style={{background: showColor ? (q.bobBit===1?'#ef4444':'#3b82f6') : '#cbd5e1'}}>
                   {step >= 1 ? q.bobBit : "?"}
                 </div>
                 <div style={{fontWeight:'bold'}}>{q.bobBasis}</div>
               </div>
             );
           })}
        </div>
      </div>
    </>
  );
}