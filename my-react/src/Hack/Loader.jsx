import React from "react";
// ✅ IMPORT THE CSS YOU JUST UPLOADED
import "./Loader.css"; 

const Loader = () => {
  return (
    <div className="loader-overlay">
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}>
        <div className="loader">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="loader-dot"></div>
          ))}
        </div>
        <div style={{color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1rem'}}>
          Initializing Quantum State...
        </div>
      </div>
    </div>
  );
};

export default Loader;