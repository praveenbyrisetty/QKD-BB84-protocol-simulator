import React from 'react';

export default function PrivacyAmpPanel({ finalKey, correctedKey }) {
  // If we haven't generated the final key yet, we just show placeholders
  const isDone = finalKey && finalKey.length > 0;

  return (
    <div className="panel" style={{
      border: '1px solid #10b981', 
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
    }}>
      <h3 className="panel-title" style={{color: '#34d399', marginBottom:'30px'}}>
        Privacy Amplification (Universal Hashing)
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px 1fr', /* Left, Matrix, Right */
        gap: '20px',
        alignItems: 'center',
        padding: '0 20px'
      }}>
        
        {/* 1. INPUT: Corrected Key */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px'}}>
            Input Key (Long)
          </div>
          <div style={{
            background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px dashed #64748b',
            width: '100%', wordBreak: 'break-all', fontFamily: 'monospace', color: '#e2e8f0', fontSize: '0.9rem',
            textAlign: 'center', minHeight: '60px', display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            {correctedKey || "Waiting..."}
          </div>
          <div style={{fontSize:'0.8rem', color:'#64748b', marginTop:'5px'}}>
            {correctedKey.length} bits
          </div>
        </div>

        {/* 2. THE PROCESS: Hashing Matrix */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', position:'relative'}}>
          {/* Arrow In */}
          <div style={{fontSize:'1.5rem', color:'#34d399', marginBottom:'5px'}}>➜</div>
          
          {/* The Matrix Visual */}
          <div style={{
            width: '80px', height: '80px', 
            background: '#10b981', 
            borderRadius: '8px', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gridTemplateRows: '1fr 1fr',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
            animation: isDone ? 'pulseMatrix 2s infinite' : 'none'
          }}>
             {/* Simple grid lines to look like a matrix */}
             <div style={{borderRight:'1px solid rgba(0,0,0,0.2)', borderBottom:'1px solid rgba(0,0,0,0.2)'}}></div>
             <div style={{borderBottom:'1px solid rgba(0,0,0,0.2)'}}></div>
             <div style={{borderRight:'1px solid rgba(0,0,0,0.2)'}}></div>
             <div></div>
             
             {/* Center Label */}
             <div style={{
               position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
               fontWeight:'bold', color:'#064e3b', fontSize:'0.9rem', marginTop:'10px'
             }}>
               HASH
             </div>
          </div>

          {/* Arrow Out */}
          <div style={{fontSize:'1.5rem', color:'#34d399', marginTop:'5px'}}>➜</div>
        </div>

        {/* 3. OUTPUT: Final Key */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px'}}>
            Secret Key (Short)
          </div>
          <div style={{
            background: isDone ? '#064e3b' : '#0f172a', 
            border: isDone ? '1px solid #10b981' : '1px dashed #64748b',
            padding: '15px', borderRadius: '8px',
            width: '100%', wordBreak: 'break-all', fontFamily: 'monospace', 
            color: '#34d399', fontWeight: 'bold', fontSize: '1rem', letterSpacing:'2px',
            textAlign: 'center', minHeight: '60px', display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: isDone ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
          }}>
            {finalKey || "..."}
          </div>
          <div style={{fontSize:'0.8rem', color: isDone ? '#34d399' : '#64748b', marginTop:'5px'}}>
            {finalKey.length} bits
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulseMatrix {
          0% { transform: scale(1); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 25px rgba(16, 185, 129, 0.6); }
          100% { transform: scale(1); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
        }
      `}</style>
    </div>
  );
}