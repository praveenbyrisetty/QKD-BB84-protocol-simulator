import React, { useEffect, useRef, useState, useCallback } from 'react';

// MediaPipe CDN scripts (version-pinned for reliability)
const MP_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js',
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = document.createElement('script');
    el.src = src; el.crossOrigin = ''; el.onload = resolve;
    el.onerror = () => reject(new Error(`Failed: ${src}`));
    document.head.appendChild(el);
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   GESTURE SUMMARY
   ━━━━━━━━━━━━━━━
   ONE HAND:
     🤏  Pinch (index + thumb close)       → move cursor, release = click
     ✌️  Peace (index + middle up, rest down) → scroll page (hand up/down)

   TWO HANDS:
     🙌  Both palms open                    → rotate 3D (both hands move)
                                              + zoom (hands apart/together)
 ────────────────────────────────────────────────────────────────────────────── */

export default function HandGestureControl() {
  const [status, setStatus]     = useState('idle'); // idle | loading | active | error
  const [gesture, setGesture]   = useState('none'); // none | pinch | peace | twoPalm
  const [cursor, setCursor]     = useState({ x: -300, y: -300, flash: false });
  const [pinched, setPinched]   = useState(false);
  const [showCam, setShowCam]   = useState(true);
  const [fps, setFps]           = useState(0);
  const [errMsg, setErrMsg]     = useState('');

  const videoRef      = useRef(null);
  const handsRef      = useRef(null);
  const camRef        = useRef(null);

  // Gesture tracking refs
  const prevPinched   = useRef(false);
  const pinchStart    = useRef(0);
  const lastCursor    = useRef({ x: -300, y: -300 });
  const dragActive    = useRef(false);

  // Two-palm refs
  const prevTwoPalmMid  = useRef(null); // { x, y }
  const prevPalmDist    = useRef(null); // distance between palms

  // Peace sign refs
  const prevPeaceY    = useRef(null);

  // FPS
  const frameCount    = useRef(0);
  const fpsTimer      = useRef(null);

  // ── Helper: detect if finger is extended ─────────────────────────────────
  const isFingerUp = (lm, tipIdx, pipIdx) => lm[tipIdx].y < lm[pipIdx].y;

  // ── Helper: detect gesture from single hand ──────────────────────────────
  const detectSingleGesture = useCallback((lm) => {
    const thumb  = lm[4], index = lm[8];
    const dist   = Math.hypot(thumb.x - index.x, thumb.y - index.y);
    const isPinch = dist < 0.07;

    // Peace sign: index & middle up, ring & pinky down
    const indexUp  = isFingerUp(lm, 8, 6);
    const middleUp = isFingerUp(lm, 12, 10);
    const ringDown = !isFingerUp(lm, 16, 14);
    const pinkyDown= !isFingerUp(lm, 20, 18);
    const isPeace  = !isPinch && indexUp && middleUp && ringDown && pinkyDown;

    if (isPinch) return 'pinch';
    if (isPeace) return 'peace';
    return 'open';
  }, []);

  // ── Helper: detect if palm is open (most fingers extended) ────────────────
  const isPalmOpen = useCallback((lm) => {
    let count = 0;
    if (isFingerUp(lm, 8, 6))  count++;
    if (isFingerUp(lm, 12, 10)) count++;
    if (isFingerUp(lm, 16, 14)) count++;
    if (isFingerUp(lm, 20, 18)) count++;
    return count >= 3;
  }, []);

  // ── onResults: called every frame by MediaPipe ────────────────────────────
  const onResults = useCallback((results) => {
    frameCount.current++;

    const hands = results.multiHandLandmarks;
    if (!hands || hands.length === 0) {
      // No hands → reset everything
      if (dragActive.current) {
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: lastCursor.current.x, clientY: lastCursor.current.y }));
        dragActive.current = false;
      }
      prevPinched.current = false; prevPeaceY.current = null;
      prevTwoPalmMid.current = null; prevPalmDist.current = null;
      setPinched(false); setGesture('none');
      return;
    }

    const W = window.innerWidth, H = window.innerHeight;

    // ═══════════════════════════════════════════════════════════════════════
    //  TWO HANDS DETECTED → rotate + zoom
    // ═══════════════════════════════════════════════════════════════════════
    if (hands.length >= 2 && isPalmOpen(hands[0]) && isPalmOpen(hands[1])) {
      setGesture('twoPalm');
      setPinched(false);
      prevPinched.current = false;

      // Palm centers (wrist landmark 0)
      const p1x = (1 - hands[0][0].x) * W, p1y = hands[0][0].y * H;
      const p2x = (1 - hands[1][0].x) * W, p2y = hands[1][0].y * H;

      const midX = (p1x + p2x) / 2;
      const midY = (p1y + p2y) / 2;
      const palmDist = Math.hypot(p2x - p1x, p2y - p1y);

      // Update cursor to midpoint
      setCursor({ x: midX, y: midY, flash: false });
      lastCursor.current = { x: midX, y: midY };

      if (prevTwoPalmMid.current !== null) {
        const dx = midX - prevTwoPalmMid.current.x;
        const dy = midY - prevTwoPalmMid.current.y;

        // Rotation: dispatch mousedown + mousemove
        if (!dragActive.current && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
          const el = document.elementFromPoint(midX, midY);
          if (el) {
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: midX, clientY: midY, view: window }));
            dragActive.current = true;
          }
        }
        if (dragActive.current) {
          document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: midX, clientY: midY, view: window }));
        }

        // Zoom: palm distance changing
        if (prevPalmDist.current !== null) {
          const distDelta = palmDist - prevPalmDist.current;
          // Only trigger if change is significant
          if (Math.abs(distDelta) > 3) {
            const el = document.elementFromPoint(midX, midY);
            if (el) {
              el.dispatchEvent(new WheelEvent('wheel', {
                bubbles: true, cancelable: true,
                clientX: midX, clientY: midY,
                deltaY: -distDelta * 2.5, // spread apart = zoom in (negative delta)
                deltaMode: 0,
              }));
            }
          }
        }
      }

      prevTwoPalmMid.current = { x: midX, y: midY };
      prevPalmDist.current = palmDist;
      prevPeaceY.current = null;
      return;
    }

    // If we were in two-palm mode and now aren't, release drag
    if (prevTwoPalmMid.current !== null) {
      if (dragActive.current) {
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: lastCursor.current.x, clientY: lastCursor.current.y }));
        dragActive.current = false;
      }
      prevTwoPalmMid.current = null;
      prevPalmDist.current = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SINGLE HAND → pinch (cursor+click) or peace (scroll)
    // ═══════════════════════════════════════════════════════════════════════
    const lm = hands[0];
    const singleGesture = detectSingleGesture(lm);

    // Cursor always tracks index fingertip (mirrored)
    const sx = Math.round((1 - lm[8].x) * W);
    const sy = Math.round(lm[8].y * H);
    setCursor({ x: sx, y: sy, flash: false });
    lastCursor.current = { x: sx, y: sy };

    // Dispatch mousemove for hover
    const hovEl = document.elementFromPoint(sx, sy);
    if (hovEl) {
      hovEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: sx, clientY: sy, view: window }));
    }

    // ── PEACE = scroll ───────────────────────────────────────────────────
    if (singleGesture === 'peace') {
      setGesture('peace');
      setPinched(false);
      prevPinched.current = false;

      // Track Y movement of mid-finger for scroll direction
      const peaceY = (lm[8].y + lm[12].y) / 2 * H;
      if (prevPeaceY.current !== null) {
        const dy = peaceY - prevPeaceY.current;
        if (Math.abs(dy) > 2) {
          window.scrollBy({ top: dy * 3.5, behavior: 'auto' });
        }
      }
      prevPeaceY.current = peaceY;
      return;
    }
    prevPeaceY.current = null;

    // ── PINCH = cursor + click/drag ──────────────────────────────────────
    const thumb = lm[4], index = lm[8];
    const dist  = Math.hypot(thumb.x - index.x, thumb.y - index.y);
    const isPinch = dist < 0.07;

    setGesture(isPinch ? 'pinch' : 'none');
    setPinched(isPinch);

    if (isPinch && !prevPinched.current) {
      // Pinch just started
      pinchStart.current = Date.now();
    }

    // Long pinch → drag mode
    if (isPinch && prevPinched.current) {
      const held = Date.now() - pinchStart.current;
      if (held > 350 && !dragActive.current) {
        const el = document.elementFromPoint(sx, sy);
        if (el) {
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: sx, clientY: sy, view: window }));
          dragActive.current = true;
        }
      }
      if (dragActive.current) {
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: sx, clientY: sy, view: window }));
      }
    }

    // Release pinch
    if (!isPinch && prevPinched.current) {
      const held = Date.now() - pinchStart.current;
      if (dragActive.current) {
        // Was dragging → mouseup
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: sx, clientY: sy, view: window }));
        dragActive.current = false;
      } else if (held < 350) {
        // Quick pinch → click
        const target = document.elementFromPoint(sx, sy);
        if (target) {
          target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: sx, clientY: sy, view: window }));
          setCursor(c => ({ ...c, flash: true }));
          setTimeout(() => setCursor(c => ({ ...c, flash: false })), 180);
        }
      }
    }

    prevPinched.current = isPinch;
  }, [detectSingleGesture, isPalmOpen]);

  // ── Activate ──────────────────────────────────────────────────────────────
  const activate = useCallback(async () => {
    setStatus('loading'); setErrMsg('');
    try {
      for (const src of MP_SCRIPTS) await loadScript(src);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }, audio: false,
      });
      if (!videoRef.current) throw new Error('Video element not ready');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const hands = new window.Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
      });
      hands.setOptions({
        maxNumHands:            2,
        modelComplexity:        1,
        minDetectionConfidence: 0.72,
        minTrackingConfidence:  0.55,
      });
      hands.onResults(onResults);
      handsRef.current = hands;

      const cam = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640, height: 480,
      });
      cam.start();
      camRef.current = cam;

      fpsTimer.current = setInterval(() => {
        setFps(frameCount.current); frameCount.current = 0;
      }, 1000);

      setStatus('active');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Camera access denied or MediaPipe failed.');
      console.error('[HandGesture]', err);
    }
  }, [onResults]);

  // ── Deactivate ────────────────────────────────────────────────────────────
  const deactivate = useCallback(() => {
    clearInterval(fpsTimer.current);
    camRef.current?.stop?.(); camRef.current = null;
    handsRef.current?.close?.(); handsRef.current = null;
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStatus('idle'); setPinched(false); setGesture('none');
    setCursor({ x: -300, y: -300, flash: false }); setFps(0);
    prevPinched.current = false; dragActive.current = false;
    prevTwoPalmMid.current = null; prevPalmDist.current = null;
    prevPeaceY.current = null;
  }, []);

  useEffect(() => () => deactivate(), [deactivate]);

  // ── Render ────────────────────────────────────────────────────────────────
  const isActive = status === 'active';
  const isLoading = status === 'loading';

  // Cursor colors based on gesture
  const cursorColor = gesture === 'twoPalm' ? '#f59e0b'
                    : gesture === 'peace'   ? '#a78bfa'
                    : pinched              ? '#4ade80'
                    : '#818cf8';


  return (
    <>
      {/* ── Floating controls stack (bottom-right) ── */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 99998,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
      }}>
        {/* Error message */}
        {status === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10,
            padding: '8px 14px', fontSize: '0.72rem', color: '#fca5a5',
            maxWidth: 240, textAlign: 'right', lineHeight: 1.4,
          }}>⚠ {errMsg || 'Camera error'}</div>
        )}

        {/* Webcam preview — sits inside the flex column */}
        {isActive && showCam && (
          <div style={{
            position: 'relative',
            borderRadius: 12, overflow: 'hidden',
            border: `1.5px solid ${gesture === 'twoPalm' ? 'rgba(245,158,11,0.7)' : gesture === 'peace' ? 'rgba(167,139,250,0.7)' : pinched ? 'rgba(34,197,94,0.7)' : 'rgba(99,102,241,0.40)'}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            transition: 'border-color 0.2s', background: '#020617',
          }}>
            <video ref={videoRef} width={180} height={135} playsInline muted
              style={{ display: 'block', transform: 'scaleX(-1)' }} />
            {/* Gesture badge */}
            <div style={{
              position: 'absolute', top: 6, left: 6,
              background: 'rgba(0,0,0,0.6)', borderRadius: 6,
              padding: '2px 8px', fontSize: '0.6rem', color: cursorColor,
              fontFamily: 'monospace', fontWeight: 700,
            }}>
              {gesture === 'twoPalm' ? '🙌 ROTATE/ZOOM' : gesture === 'peace' ? '✌️ SCROLL' : pinched ? '🤏 PINCH' : '👆 POINT'}
            </div>
            {/* Status dot */}
            <div style={{
              position: 'absolute', top: 6, right: 6,
              width: 10, height: 10, borderRadius: '50%',
              background: cursorColor,
              boxShadow: `0 0 8px ${cursorColor}`,
              transition: 'all 0.15s',
            }} />
            {/* Bottom hint */}
            <div style={{
              position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
              fontSize: '0.50rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace',
              pointerEvents: 'none', lineHeight: 1.3,
            }}>
              {gesture === 'twoPalm'
                ? 'Move hands to rotate · Spread/pinch to zoom'
                : gesture === 'peace'
                  ? 'Move up/down to scroll'
                  : 'Pinch = click · ✌️ = scroll · 🙌 = rotate'}
            </div>
          </div>
        )}

        {/* Show/hide cam toggle */}
        {isActive && (
          <button onClick={() => setShowCam(v => !v)} style={{
            background: 'rgba(5,8,24,0.80)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8',
            borderRadius: 8, padding: '5px 12px', fontSize: '0.68rem', cursor: 'pointer',
            fontFamily: 'monospace',
          }}>{showCam ? '🙈 Hide cam' : '👁 Show cam'}</button>
        )}

        {/* Main toggle button */}
        <button
          onClick={isActive ? deactivate : activate}
          disabled={isLoading}
          style={{
            background: isActive ? 'rgba(34,197,94,0.15)' : isLoading ? 'rgba(99,102,241,0.15)' : 'rgba(5,8,24,0.80)',
            backdropFilter: 'blur(12px)',
            border: `1.5px solid ${isActive ? 'rgba(34,197,94,0.5)' : isLoading ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.25)'}`,
            color: isActive ? '#4ade80' : isLoading ? '#818cf8' : '#94a3b8',
            borderRadius: 12, padding: '10px 16px',
            fontSize: '0.78rem', cursor: isLoading ? 'wait' : 'pointer',
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: isActive ? '0 0 20px rgba(34,197,94,0.20)' : 'none',
            transition: 'all 0.3s', letterSpacing: '0.3px',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{isActive ? '✋' : isLoading ? '⏳' : '🖐️'}</span>
          {isActive ? 'Hand Control ON' : isLoading ? 'Loading…' : 'Hand Control'}
          {isActive && (
            <span style={{
              background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 6, padding: '2px 7px', fontSize: '0.62rem', color: '#86efac',
            }}>{fps} fps</span>
          )}
        </button>
      </div>

      {/* ── Custom cursor ── */}
      {isActive && (
        <div style={{
          position: 'fixed', left: cursor.x, top: cursor.y,
          transform: 'translate(-50%,-50%)',
          zIndex: 999999, pointerEvents: 'none',
        }}>
          {/* Outer ring */}
          <div style={{
            width: gesture === 'twoPalm' ? 50 : pinched ? 28 : 38,
            height: gesture === 'twoPalm' ? 50 : pinched ? 28 : 38,
            borderRadius: '50%',
            border: `2.5px solid ${cursorColor}`,
            boxShadow: `0 0 12px ${cursorColor}90`,
            background: cursor.flash ? `${cursorColor}50`
              : gesture === 'twoPalm' ? 'rgba(245,158,11,0.10)'
              : pinched ? 'rgba(74,222,128,0.12)' : 'rgba(129,140,248,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'width 0.12s, height 0.12s, border-color 0.15s, background 0.12s',
          }}>
            <div style={{
              width: pinched ? 8 : 5, height: pinched ? 8 : 5,
              borderRadius: '50%', background: cursorColor,
              boxShadow: `0 0 6px ${cursorColor}`,
              transition: 'all 0.12s',
            }} />
          </div>
        </div>
      )}

      {/* ── Gesture guide (top banner when active) ── */}
      {isActive && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 99996, background: 'rgba(5,8,24,0.82)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(129,140,248,0.25)', borderRadius: 12,
          padding: '7px 22px', fontSize: '0.68rem', color: '#94a3b8',
          fontFamily: 'monospace', display: 'flex', gap: 16, alignItems: 'center',
          pointerEvents: 'none', animation: 'hgFadeIn 0.4s ease-out',
        }}>
          <span>🤏 <strong style={{ color: '#4ade80' }}>Pinch</strong> click</span>
          <span style={{ color: '#334155' }}>·</span>
          <span>✌️ <strong style={{ color: '#a78bfa' }}>Two fingers</strong> scroll</span>
          <span style={{ color: '#334155' }}>·</span>
          <span>🙌 <strong style={{ color: '#f59e0b' }}>Two palms</strong> rotate/zoom</span>
        </div>
      )}

      <style>{`@keyframes hgFadeIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </>
  );
}
