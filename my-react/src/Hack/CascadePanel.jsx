import React from 'react';

export default function CascadePanel({ siftedQubits }) {
  const sifted = siftedQubits.filter(q => q.aliceBasis === q.bobBasis);

  // 1. Calculate Error Rate (E)
  let errors = 0;
  sifted.forEach(q => { if (q.aliceBit !== q.bobBit) errors++; });
  const errorRate = sifted.length > 0 ? (errors / sifted.length) * 100 : 0; // In %
  
  // 2. LOGIC: Determine Block Size based on Range
  let k = 4; // Default (Safe fallback for high errors)

  if (errorRate <= 1) {
    k = 72; // Very clean channel
  } else if (errorRate <= 5) {
    k = 14;
  } else if (errorRate <= 10) {
    k = 7;
  } else {
    k = 4;  // Noisy channel (> 10%)
  }

  // 3. Create Blocks
  const blocks = [];
  for (let i = 0; i < sifted.length; i += k) {
    blocks.push({
      data: sifted.slice(i, i + k),
      range: `${i+1}-${Math.min(i+k, sifted.length)}`
    });
  }

  return (
    <div className="panel" style={{
      border: '1px solid #6366f1', 
      height: '100%', 
      boxSizing: 'border-box',
      borderRadius: '12px',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'rgba(15, 23, 42, 0.6)',
      padding: '20px' 
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
        <h3 className="panel-title" style={{
          color: '#818cf8', margin: 0
        }}>
          Cascade Protocol
        </h3>
        
        {/* Visual Indicator of the Logic Used */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'end'}}>
          <div style={{fontSize:'0.7rem', color:'#94a3b8', border:'1px solid #334155', padding:'2px 8px', borderRadius:'4px', marginBottom:'4px'}}>
             Error Rate: <span style={{color: errorRate > 0 ? '#ef4444' : '#10b981', fontWeight:'bold'}}>{errorRate.toFixed(1)}%</span>
          </div>
          <div style={{fontSize:'0.65rem', color:'#64748b'}}>
             Block Size: <span style={{color:'#fff', fontWeight:'bold'}}>{k} bits</span> (Range Logic)
          </div>
        </div>
      </div>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '5px',
        paddingBottom: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', 
        gridAutoRows: 'max-content',
        gap: '10px',
        alignContent: 'start'
      }}>
        {blocks.map((blockObj, bIdx) => {
          const block = blockObj.data;
          const aliceParity = block.reduce((s, q) => s + q.aliceBit, 0) % 2;
          const bobParity = block.reduce((s, q) => s + q.bobBit, 0) % 2;
          const hasError = aliceParity !== bobParity;
          
          return (
            <div key={bIdx} style={{
              background: '#0f172a', 
              padding:'10px', 
              borderRadius:'6px', 
              border: hasError ? '1px solid #ef4444' : '1px solid #10b981', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{color:'#94a3b8', fontSize:'0.65rem', textTransform:'uppercase'}}>
                  BITS {blockObj.range}
                </div>
                <div style={{fontWeight:'bold', color: hasError ? '#ef4444' : '#10b981', fontSize:'0.65rem'}}>
                  {hasError ? "PARITY ERR" : "MATCH"}
                </div>
              </div>

              {/* Show bits (limited to 8 for UI cleanliness) */}
              <div style={{display:'flex', gap:'3px', justifyContent:'center', flexWrap:'wrap'}}>
                {block.slice(0, 8).map((q, i) => (
                  <div key={i} style={{textAlign:'center'}}>
                    <div className={`circle ${q.aliceBit===1?'bg-red':'bg-blue'}`} style={{
                      width:'12px', height:'12px', fontSize:'0.55rem', lineHeight:'12px', 
                      display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'bold'
                    }}>
                      {q.aliceBit}
                    </div>
                    <div className={`circle ${q.bobBit===1?'bg-red':'bg-blue'}`} style={{
                      width:'12px', height:'12px', fontSize:'0.55rem', lineHeight:'12px', marginTop:'2px', 
                      border: q.aliceBit!==q.bobBit ? '1px solid #ef4444' : 'none',
                      display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'bold',
                      opacity: 0.8
                    }}>
                      {q.bobBit}
                    </div>
                  </div>
                ))}
                {block.length > 8 && <div style={{fontSize:'0.6rem', color:'#64748b', alignSelf:'center'}}>...</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}