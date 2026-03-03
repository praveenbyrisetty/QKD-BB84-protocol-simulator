import React, { useEffect, useRef, useCallback, useState } from 'react';

// The 4 canonical polarization types in BB84
const PHOTON_TYPES = [
  { aliceBit: 0, aliceBasis: '+', bobBasis: '+', bobBit: 0, typeLabel: 'Type 1 / 4' },
  { aliceBit: 1, aliceBasis: '+', bobBasis: '+', bobBit: 1, typeLabel: 'Type 2 / 4' },
  { aliceBit: 0, aliceBasis: '×', bobBasis: '×', bobBit: 0, typeLabel: 'Type 3 / 4' },
  { aliceBit: 1, aliceBasis: '×', bobBasis: '×', bobBit: 1, typeLabel: 'Type 4 / 4' },
];

function getInitialIndex(qubit) {
  if (!qubit) return 0;
  return PHOTON_TYPES.findIndex(
    (t) => t.aliceBit === qubit.aliceBit && t.aliceBasis === qubit.aliceBasis
  ) ?? 0;
}

function getPol(qubit) {
  if (!qubit) return { angle: 90, symbol: '↑', label: 'Vertical',     deg: '90°'  };
  if (qubit.aliceBasis === '+')
    return qubit.aliceBit === 0
      ? { angle: 90,  symbol: '↑', label: 'Vertical',     deg: '90°'  }
      : { angle: 0,   symbol: '→', label: 'Horizontal',   deg: '0°'   };
  return qubit.aliceBit === 0
    ? { angle: 45,  symbol: '↗', label: 'Diagonal +45°', deg: '+45°' }
    : { angle: 135, symbol: '↖', label: 'Diagonal −45°', deg: '−45°' };
}

/**
 * Photon3DModal — Fullscreen space view with left/right navigation
 * through the 4 canonical BB84 polarization types.
 */
export default function Photon3DModal({ qubit, onClose }) {
  const [idx, setIdx] = useState(() => Math.max(0, getInitialIndex(qubit)));

  const activeQubit = PHOTON_TYPES[idx];
  const pol         = getPol(activeQubit);
  const bit         = activeQubit.aliceBit;
  const mainColor   = bit === 1 ? '#ef4444' : '#38bdf8';
  const basisLabel  = activeQubit.aliceBasis === '+' ? 'Rectilinear (+)' : 'Diagonal (×)';

  const canvasRef  = useRef(null);
  const dragRef    = useRef({ active: false, lastX: 0, lastY: 0 });
  const camRef     = useRef({ rotX: 0.35, rotY: 0.6, dist: 700 });
  const rafRef     = useRef(null);
  const frameRef   = useRef(0);
  const autoRotRef = useRef(true);
  const starsRef   = useRef(null);

  const navigate = useCallback((dir) => {
    setIdx((i) => (i + dir + PHOTON_TYPES.length) % PHOTON_TYPES.length);
    autoRotRef.current = true; // restart auto-rotate on navigation
  }, []);

  // stars
  const getStars = () => {
    if (starsRef.current) return starsRef.current;
    starsRef.current = Array.from({ length: 280 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.8 + 0.2,
      b: Math.random(),
      sp: Math.random() * 0.03 + 0.005,
      off: Math.random() * Math.PI * 2,
    }));
    return starsRef.current;
  };

  // 3-D perspective projection
  const proj = (x, y, z, rX, rY, dist, cx, cy) => {
    const cosY = Math.cos(rY), sinY = Math.sin(rY);
    const x2 = x * cosY + z * sinY, z2 = -x * sinY + z * cosY;
    const cosX = Math.cos(rX), sinX = Math.sin(rX);
    const y2 = y * cosX - z2 * sinX, z3 = y * sinX + z2 * cosX;
    const f = dist / (dist + z3 + 0.001);
    return { sx: cx + x2 * f, sy: cy + y2 * f, z: z3, f };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(draw); return; }
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
    const cx = W / 2, cy = H / 2;
    frameRef.current++;
    const t = frameRef.current;

    if (autoRotRef.current) camRef.current.rotY += 0.0025;
    const { rotX: rX, rotY: rY, dist } = camRef.current;
    const R = Math.min(W, H) * 0.27;
    const [mr,mg,mb] = bit === 1 ? [239,68,68] : [56,189,248];

    // Background
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy*0.8, 0, cx, cy, Math.max(W,H)*0.75);
    bg.addColorStop(0, '#0d1433'); bg.addColorStop(0.5,'#07091a'); bg.addColorStop(1,'#020308');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Nebulas
    [
      { nx:cx-W*0.22, ny:cy+H*0.08, r:W*0.26, a:0.10, c:[99,102,241] },
      { nx:cx+W*0.20, ny:cy-H*0.12, r:W*0.20, a:0.08, c:[mr,mg,mb]   },
      { nx:cx,        ny:cy+H*0.32, r:W*0.30, a:0.06, c:[129,140,248] },
    ].forEach(({ nx,ny,r,a,c:[r1,g1,b1] }) => {
      const ng = ctx.createRadialGradient(nx,ny,0,nx,ny,r);
      ng.addColorStop(0, `rgba(${r1},${g1},${b1},${a})`);
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.ellipse(nx,ny,r*1.3,r*0.7,0.4,0,Math.PI*2); ctx.fill();
    });

    // Stars
    getStars().forEach(s => {
      const tw = 0.35 + 0.65 * Math.sin(t * s.sp + s.off);
      ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${tw*s.b})`; ctx.fill();
    });

    // Atmosphere halo
    const halo = ctx.createRadialGradient(cx,cy,R*0.9, cx,cy,R*2);
    halo.addColorStop(0,   `rgba(${mr},${mg},${mb},0.18)`);
    halo.addColorStop(0.4, `rgba(${mr},${mg},${mb},0.06)`);
    halo.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(cx,cy,R*2,0,Math.PI*2); ctx.fillStyle=halo; ctx.fill();

    // Sphere fill
    const fill = ctx.createRadialGradient(cx-R*0.3,cy-R*0.3,R*0.05, cx,cy,R);
    fill.addColorStop(0,   `rgba(${mr},${mg},${mb},0.55)`);
    fill.addColorStop(0.3, `rgba(${mr},${mg},${mb},0.28)`);
    fill.addColorStop(0.7, `rgba(${mr},${mg},${mb},0.12)`);
    fill.addColorStop(1,   `rgba(${mr},${mg},${mb},0.03)`);
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill();

    // Wireframe
    const drawRing = (pts, op) => {
      ctx.beginPath();
      pts.forEach((p,i) => i===0 ? ctx.moveTo(p.sx,p.sy) : ctx.lineTo(p.sx,p.sy));
      ctx.closePath();
      ctx.strokeStyle = `rgba(${mr},${mg},${mb},${op})`;
      ctx.lineWidth = 0.9; ctx.stroke();
    };
    [-60,-30,0,30,60].forEach(deg => {
      const pts=[], elev=deg*Math.PI/180;
      for (let a=0;a<=360;a+=5) {
        const r2=a*Math.PI/180;
        pts.push(proj(R*Math.cos(elev)*Math.cos(r2), R*Math.sin(elev), R*Math.cos(elev)*Math.sin(r2), rX,rY,dist,cx,cy));
      }
      drawRing(pts, pts.reduce((s,p)=>s+p.z,0)/pts.length > 0 ? 0.18:0.50);
    });
    for (let lon=0;lon<180;lon+=30) {
      const pts=[], lonR=lon*Math.PI/180;
      for (let a=0;a<=360;a+=5) {
        const r2=a*Math.PI/180;
        pts.push(proj(R*Math.cos(lonR)*Math.cos(r2), R*Math.sin(r2), R*Math.sin(lonR)*Math.cos(r2), rX,rY,dist,cx,cy));
      }
      drawRing(pts, pts.reduce((s,p)=>s+p.z,0)/pts.length > 0 ? 0.18:0.50);
    }

    // Specular
    const spec = ctx.createRadialGradient(cx-R*0.32,cy-R*0.32,0, cx-R*0.2,cy-R*0.2,R*0.45);
    spec.addColorStop(0,'rgba(255,255,255,0.22)'); spec.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=spec; ctx.fill();

    // Axes
    const origin = proj(0,0,0,rX,rY,dist,cx,cy);
    ctx.setLineDash([5,6]); ctx.lineWidth=1;
    [[proj(R*1.5,0,0,rX,rY,dist,cx,cy),'H'],[proj(0,-R*1.5,0,rX,rY,dist,cx,cy),'V']].forEach(([p,lbl])=>{
      ctx.beginPath(); ctx.moveTo(origin.sx,origin.sy); ctx.lineTo(p.sx,p.sy);
      ctx.strokeStyle='rgba(148,163,184,0.35)'; ctx.stroke();
      ctx.fillStyle='rgba(148,163,184,0.55)'; ctx.font='bold 14px monospace';
      ctx.textAlign='center'; ctx.fillText(lbl, p.sx, p.sy-10);
    });
    ctx.setLineDash([]);

    // Polarization arrow
    const pRad = pol.angle*Math.PI/180;
    const aLen = R*1.5;
    const aX=aLen*Math.sin(pRad), aY=-aLen*Math.cos(pRad);
    const tip  = proj( aX, aY,0, rX,rY,dist,cx,cy);
    const tail = proj(-aX,-aY,0, rX,rY,dist,cx,cy);

    const glow = ctx.createLinearGradient(tail.sx,tail.sy,tip.sx,tip.sy);
    glow.addColorStop(0,'rgba(0,0,0,0)');
    glow.addColorStop(0.4,`rgba(${mr},${mg},${mb},0.22)`);
    glow.addColorStop(1, `rgba(${mr},${mg},${mb},0.60)`);
    ctx.beginPath(); ctx.moveTo(tail.sx,tail.sy); ctx.lineTo(tip.sx,tip.sy);
    ctx.strokeStyle=glow; ctx.lineWidth=16; ctx.lineCap='round'; ctx.stroke();

    const shaft = ctx.createLinearGradient(tail.sx,tail.sy,tip.sx,tip.sy);
    shaft.addColorStop(0,`rgba(${mr},${mg},${mb},0.4)`); shaft.addColorStop(1,mainColor);
    ctx.beginPath(); ctx.moveTo(tail.sx,tail.sy); ctx.lineTo(tip.sx,tip.sy);
    ctx.strokeStyle=shaft; ctx.lineWidth=4; ctx.stroke();

    const ang=Math.atan2(tip.sy-tail.sy,tip.sx-tail.sx), hl=24;
    ctx.beginPath();
    ctx.moveTo(tip.sx,tip.sy);
    ctx.lineTo(tip.sx-hl*Math.cos(ang-Math.PI/5.5), tip.sy-hl*Math.sin(ang-Math.PI/5.5));
    ctx.moveTo(tip.sx,tip.sy);
    ctx.lineTo(tip.sx-hl*Math.cos(ang+Math.PI/5.5), tip.sy-hl*Math.sin(ang+Math.PI/5.5));
    ctx.strokeStyle=mainColor; ctx.lineWidth=3.5; ctx.stroke();

    const tipG = ctx.createRadialGradient(tip.sx,tip.sy,0,tip.sx,tip.sy,22);
    tipG.addColorStop(0,mainColor); tipG.addColorStop(0.4,`rgba(${mr},${mg},${mb},0.7)`); tipG.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(tip.sx,tip.sy,22,0,Math.PI*2); ctx.fillStyle=tipG; ctx.fill();
    ctx.beginPath(); ctx.arc(tip.sx,tip.sy,5,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fillStyle=`rgba(${mr},${mg},${mb},0.8)`; ctx.fill();

    // Angle arc
    if (pol.angle > 0) {
      const arcR=R*0.38;
      ctx.beginPath(); ctx.arc(cx,cy,arcR,-Math.PI/2,-Math.PI/2+pol.angle*Math.PI/180);
      ctx.strokeStyle=`rgba(${mr},${mg},${mb},0.45)`; ctx.lineWidth=1.5;
      ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]);
      const midA=-Math.PI/2+pol.angle*Math.PI/360;
      ctx.fillStyle=`rgba(${mr},${mg},${mb},0.9)`; ctx.font='bold 15px monospace'; ctx.textAlign='center';
      ctx.fillText(pol.deg, cx+arcR*1.5*Math.cos(midA), cy+arcR*1.5*Math.sin(midA)+5);
    }

    rafRef.current = requestAnimationFrame(draw);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bit, pol.angle, pol.deg, mainColor]);

  // Resize canvas
  useEffect(() => {
    const resize = () => { const c=canvasRef.current; if(!c)return; c.width=window.innerWidth; c.height=window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, navigate]);

  // Drag / touch / scroll
  const startDrag = (x,y) => { autoRotRef.current=false; dragRef.current={active:true,lastX:x,lastY:y}; };
  const moveDrag  = (x,y) => {
    if (!dragRef.current.active) return;
    camRef.current.rotY += (x-dragRef.current.lastX)*0.006;
    camRef.current.rotX  = Math.max(-1.4,Math.min(1.4,camRef.current.rotX+(y-dragRef.current.lastY)*0.006));
    dragRef.current.lastX=x; dragRef.current.lastY=y;
  };
  const endDrag = () => { dragRef.current.active=false; };
  const onWheel = (e) => { e.preventDefault(); camRef.current.dist=Math.max(300,Math.min(1400,camRef.current.dist+e.deltaY*0.6)); };
  const resetView = () => { camRef.current={rotX:0.35,rotY:0.6,dist:700}; autoRotRef.current=true; };

  const [mr,mg,mb] = bit===1 ? [239,68,68]:[56,189,248];

  // Arrow button style
  const arrowBtn = (side) => ({
    position: 'fixed', top:'50%', [side]: 20,
    transform: 'translateY(-50%)',
    zIndex: 100001,
    width: 52, height: 52,
    borderRadius: '50%',
    background: 'rgba(5,8,24,0.72)',
    backdropFilter: 'blur(14px)',
    border: `1px solid rgba(${mr},${mg},${mb},0.40)`,
    color: mainColor,
    fontSize: '1.4rem',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 0 20px rgba(${mr},${mg},${mb},0.20)`,
    transition: 'all 0.2s',
  });

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999 }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ display:'block', width:'100vw', height:'100vh', cursor:'grab', userSelect:'none', touchAction:'none' }}
        onMouseDown={(e)=>startDrag(e.clientX,e.clientY)}
        onMouseMove={(e)=>moveDrag(e.clientX,e.clientY)}
        onMouseUp={endDrag} onMouseLeave={endDrag}
        onWheel={onWheel}
        onTouchStart={(e)=>startDrag(e.touches[0].clientX,e.touches[0].clientY)}
        onTouchMove={(e)=>moveDrag(e.touches[0].clientX,e.touches[0].clientY)}
        onTouchEnd={endDrag}
      />

      {/* ← Left arrow */}
      <button
        style={arrowBtn('left')}
        onClick={() => navigate(-1)}
        title="Previous polarization type (←)"
        onMouseEnter={(e)=>{ e.currentTarget.style.background='rgba(5,8,24,0.95)'; e.currentTarget.style.transform='translateY(-50%) scale(1.1)'; }}
        onMouseLeave={(e)=>{ e.currentTarget.style.background='rgba(5,8,24,0.72)'; e.currentTarget.style.transform='translateY(-50%) scale(1)'; }}
      >‹</button>

      {/* → Right arrow */}
      <button
        style={arrowBtn('right')}
        onClick={() => navigate(1)}
        title="Next polarization type (→)"
        onMouseEnter={(e)=>{ e.currentTarget.style.background='rgba(5,8,24,0.95)'; e.currentTarget.style.transform='translateY(-50%) scale(1.1)'; }}
        onMouseLeave={(e)=>{ e.currentTarget.style.background='rgba(5,8,24,0.72)'; e.currentTarget.style.transform='translateY(-50%) scale(1)'; }}
      >›</button>

      {/* Top-left title */}
      <div style={{ position:'fixed', top:20, left:80, zIndex:100000 }}>
        <div style={{
          background:'rgba(5,8,24,0.72)', backdropFilter:'blur(14px)',
          border:'1px solid rgba(129,140,248,0.30)', borderRadius:14,
          padding:'10px 18px',
        }}>
          <div style={{ fontSize:'0.58rem', letterSpacing:'2px', color:'rgba(129,140,248,0.7)', fontFamily:'monospace', marginBottom:3 }}>
            ⚛ PHOTON POLARIZATION · {PHOTON_TYPES[idx].typeLabel}
          </div>
          <div style={{
            fontSize:'1.3rem', fontWeight:800, fontFamily:"'Inter',sans-serif",
            background:'linear-gradient(90deg,#818cf8,#c7d2fe)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>
            {pol.symbol}  {pol.label}
          </div>
        </div>
      </div>

      {/* Top-right buttons */}
      <div style={{ position:'fixed', top:20, right:80, zIndex:100000, display:'flex', gap:10 }}>
        <button onClick={resetView} style={{
          background:'rgba(5,8,24,0.72)', backdropFilter:'blur(14px)',
          border:`1px solid rgba(${mr},${mg},${mb},0.35)`,
          color:`rgba(${mr},${mg},${mb},1)`, fontFamily:'monospace',
          fontSize:'0.78rem', padding:'8px 18px', borderRadius:10, cursor:'pointer',
        }}>↺ Reset View</button>
        <button onClick={onClose} style={{
          background:'rgba(239,68,68,0.12)', backdropFilter:'blur(14px)',
          border:'1px solid rgba(239,68,68,0.4)', color:'#fca5a5',
          fontFamily:'monospace', fontSize:'0.78rem', padding:'8px 18px',
          borderRadius:10, cursor:'pointer',
        }}>✕ Close <span style={{fontSize:'0.62rem',opacity:0.6}}>[Esc]</span></button>
      </div>

      {/* Bottom HUD */}
      <div style={{
        position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
        zIndex:100000, width:'min(740px, 88vw)',
        display:'flex', flexDirection:'column', gap:10,
        animation:'p3dHudIn 0.4s ease-out both',
      }}>
        {/* Type selector dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:2 }}>
          {PHOTON_TYPES.map((tp, i) => {
            const tpol = getPol(tp);
            const isActive = i === idx;
            const tColor = tp.aliceBit===1 ? '#ef4444':'#38bdf8';
            return (
              <button
                key={i}
                onClick={() => { setIdx(i); autoRotRef.current=true; }}
                title={`${tpol.label} (${tpol.deg})`}
                style={{
                  width: isActive ? 42 : 34, height: 34,
                  borderRadius: 8,
                  background: isActive ? `rgba(${tp.aliceBit===1?'239,68,68':'56,189,248'},0.18)` : 'rgba(5,8,24,0.65)',
                  backdropFilter: 'blur(10px)',
                  border: `1.5px solid ${isActive ? tColor+'80' : 'rgba(148,163,184,0.20)'}`,
                  color: isActive ? tColor : 'rgba(148,163,184,0.5)',
                  fontSize: isActive ? '1.1rem' : '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                {tpol.symbol}
              </button>
            );
          })}
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            { label:"Alice's Bit",  value:activeQubit.aliceBit, color:'#f43f5e' },
            { label:'Alice Basis',  value:activeQubit.aliceBasis, color:mainColor },
            { label:'Polarization', value:pol.deg, color:'#818cf8' },
            { label:'Symbol',       value:pol.symbol, color:mainColor },
          ].map(({label,value,color})=>(
            <div key={label} style={{
              background:'rgba(5,8,24,0.80)', backdropFilter:'blur(14px)',
              border:`1px solid ${color}35`, borderRadius:14,
              padding:'12px 8px', textAlign:'center',
            }}>
              <div style={{ fontSize:'0.52rem', color:`${color}90`, fontWeight:700, letterSpacing:'1.2px', marginBottom:6, textTransform:'uppercase', fontFamily:'monospace' }}>{label}</div>
              <div style={{ fontSize:'1.5rem', color, fontWeight:900, fontFamily:'monospace', lineHeight:1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Basis bar */}
        <div style={{
          background:'rgba(5,8,24,0.78)', backdropFilter:'blur(14px)',
          border:'1px solid rgba(99,102,241,0.22)', borderRadius:14,
          padding:'11px 18px', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.5,
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:16,
        }}>
          <span>
            <strong style={{color:'#c7d2fe'}}>{basisLabel}</strong>
            {activeQubit.aliceBasis==='+'
              ? <> — polarized at <strong style={{color:mainColor}}>0°</strong> or <strong style={{color:mainColor}}>90°</strong></>
              : <> — polarized at <strong style={{color:mainColor}}>+45°</strong> or <strong style={{color:mainColor}}>−45°</strong></>}
          </span>
          <span style={{ fontSize:'0.68rem', color:'rgba(148,163,184,0.45)', fontFamily:'monospace', whiteSpace:'nowrap' }}>
            ← → arrow keys to navigate
          </span>
        </div>

        {/* Tips */}
        <div style={{ display:'flex', justifyContent:'center', gap:24, fontSize:'0.62rem', color:'rgba(148,163,184,0.35)', fontFamily:'monospace' }}>
          <span>🖱 Drag to rotate</span><span>⚲ Scroll to zoom</span><span>← → Navigate types</span>
        </div>
      </div>

      <style>{`@keyframes p3dHudIn{from{opacity:0;transform:translateX(-50%) translateY(18px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}
