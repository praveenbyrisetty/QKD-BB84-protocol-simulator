import React from 'react';

export default function AlicePanel({ qubits, step }) {
  const displaySlice = qubits ? qubits.slice(0, 100) : [];
  const totalBits = qubits ? qubits.length : 0;
  
  const zeros = qubits.filter(q => q.aliceBit === 0).length;
  const ones = qubits.filter(q => q.aliceBit === 1).length;

  const getArrow = (basis, bit) => {
    if (basis === '+') return bit === 0 ? "↑" : "→"; 
    if (basis === 'x') return bit === 0 ? "↗" : "↖"; 
    return "?";
  };

  return (
    <div className="panel" style={{border: '1px solid #f43f5e', display:'flex', flexDirection:'column', overflow:'hidden', height: '100%'}}>
      <div className="panel-title" style={{color: '#f43f5e'}}>ALICE (Sender)</div>

      {totalBits === 0 ? (
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontStyle:'italic'}}>
          Waiting to transmit...
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'15px', height:'100%', minHeight:0}}>
          
          {/* STATS */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', flexShrink: 0}}>
             <div style={{background:'#0f172a', padding:'10px', borderRadius:'8px', textAlign:'center'}}>
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#fff'}}>{totalBits}</div>
                <div style={{fontSize:'0.7rem', color:'#94a3b8', textTransform:'uppercase'}}>Total Qubits</div>
             </div>
             <div style={{background:'#0f172a', padding:'10px', borderRadius:'8px', textAlign:'center'}}>
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#f43f5e'}}>
                  {((ones / totalBits) * 100).toFixed(0)}%
                </div>
                <div style={{fontSize:'0.7rem', color:'#94a3b8', textTransform:'uppercase'}}>Ones Ratio</div>
             </div>
          </div>

          {/* SCROLLABLE DATA */}
          <div style={{background:'#0f172a', padding:'15px', borderRadius:'8px', flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', flexShrink: 0}}>
               <span style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:'bold'}}>LIVE STREAM</span>
               <span style={{fontSize:'0.75rem', color:'#f43f5e'}}>
                 {step >= 2 ? "SIFTED VIEW" : "RAW VIEW"}
               </span>
            </div>
            
            <div style={{
              flex: 1, 
              overflowY: 'auto', 
              paddingRight: '5px',
              display:'flex', 
              flexWrap:'wrap', 
              gap:'10px',
              alignContent: 'start'
            }}>
              {displaySlice.map((q) => {
                const isMatch = q.aliceBasis === q.bobBasis;
                const isSifted = step >= 2;

                // 1. Determine Base Color (Red/Blue)
                const baseColor = q.aliceBit === 1 ? '#ef4444' : '#3b82f6';
                
                // 2. Determine Final Color (Green if Match & Sifted, else Base)
                const finalColor = (isSifted && isMatch) ? '#22c55e' : baseColor;

                // 3. Determine Opacity (Dim if Sifted & Mismatch)
                const opacity = (isSifted && !isMatch) ? 0.15 : 1;

                return (
                  <div key={q.id} style={{display:'flex', flexDirection:'column', alignItems:'center', width:'28px', opacity: opacity}}>
                     <div style={{fontSize:'0.9rem', fontWeight:'bold', color:'#94a3b8', marginBottom:'2px'}}>
                       {q.aliceBasis}
                     </div>
                     
                     <div style={{
                       width:'28px', height:'28px', borderRadius:'50%', 
                       background: finalColor,
                       boxShadow: `0 0 8px ${finalColor}80`, /* Soft Glow */
                       fontSize:'1.1rem', 
                       color: '#fff', 
                       display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'
                     }}>
                       {getArrow(q.aliceBasis, q.aliceBit)}
                     </div>
                     
                     <div style={{fontSize:'0.6rem', color: isSifted && isMatch ? '#22c55e' : '#64748b', marginTop:'1px'}}>{q.aliceBit}</div>
                  </div>
                );
              })}
            </div>
            
            <div style={{marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #334155', fontSize:'0.7rem', color:'#64748b', textAlign:'center', flexShrink: 0}}>
               {step < 2 ? "Waiting to Sift Keys..." : "✅ Non-matching bases discarded"}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}