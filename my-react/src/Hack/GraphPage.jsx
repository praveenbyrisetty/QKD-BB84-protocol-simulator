import React from 'react';

export default function GraphPage({ qubits }) {
  const siftedData = qubits ? qubits.filter(q => q.aliceBasis === q.bobBasis) : [];

  if (siftedData.length === 0) {
    return (
      <div style={{
        height: '100%', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748b', fontStyle: 'italic',
        background: 'rgba(0,0,0,0.1)', borderRadius: '8px',
        minHeight: '200px'
      }}>
        Waiting for sifted data...
      </div>
    );
  }

  // --- PERFORMANCE OPTIMIZATION FOR 10,000 POINTS ---
  // If data > 300 points, we sample it to keep SVG fast
  let displayData = siftedData;
  const maxPoints = 300;
  if (siftedData.length > maxPoints) {
    const step = Math.ceil(siftedData.length / maxPoints);
    displayData = siftedData.filter((_, index) => index % step === 0);
  }

  const width = 1200; 
  const height = 350; 
  const paddingX = 60; 
  const paddingY = 60;

  const getX = (index) => {
    const totalPoints = displayData.length;
    const chartWidth = width - (paddingX * 2);
    const step = totalPoints > 1 ? chartWidth / (totalPoints - 1) : chartWidth; 
    return paddingX + (index * step);
  };

  const getY = (bitValue) => bitValue === 1 ? paddingY : height - paddingY;

  const alicePoints = displayData.map((q, i) => `${getX(i)},${getY(q.aliceBit)}`).join(" ");
  const bobPoints = displayData.map((q, i) => `${getX(i)},${getY(q.bobBit)}`).join(" ");

  return (
    <div style={{width: '100%', height: '100%', overflow: 'hidden'}}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        style={{width: '100%', height: '100%', display: 'block'}}
      >
        {/* GRID */}
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#475569" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#475569" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />

        {/* AXES */}
        <line x1={paddingX} y1={paddingY - 20} x2={paddingX} y2={height - paddingY + 20} stroke="#94a3b8" strokeWidth="2" />
        <line x1={paddingX - 10} y1={height - paddingY + 20} x2={width - paddingX + 10} y2={height - paddingY + 20} stroke="#94a3b8" strokeWidth="2" />

        {/* LABELS */}
        <text x={paddingX - 20} y={height - paddingY} fill="#94a3b8" fontSize="24" fontWeight="bold" textAnchor="end" alignmentBaseline="middle">0</text>
        <text x={paddingX - 20} y={paddingY} fill="#94a3b8" fontSize="24" fontWeight="bold" textAnchor="end" alignmentBaseline="middle">1</text>

        {/* DATA LINES */}
        <polyline points={alicePoints} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinejoin="round" />
        <polyline points={bobPoints} fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="8,8" opacity="0.9" strokeLinejoin="round" />

        {/* MARKERS: Only show if data is small (< 80 points) */}
        {displayData.length < 80 && displayData.map((q, i) => {
          const x = getX(i);
          const yAlice = getY(q.aliceBit);
          const yBob = getY(q.bobBit);
          return (
            <g key={i}>
              <circle cx={x} cy={yAlice} r="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="3" />
              {q.aliceBit !== q.bobBit && (
                 <circle cx={x} cy={yBob} r="6" fill="#f97316" stroke="#f97316" strokeWidth="0" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}