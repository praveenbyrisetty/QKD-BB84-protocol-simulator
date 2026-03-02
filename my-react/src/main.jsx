import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Lazy-load routes so mobile only downloads MobileChat (not the heavy App bundle)
const App = React.lazy(() => import('./App.jsx'));
const MobileChat = React.lazy(() => import('./Hack/MobileChat.jsx'));

const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    color: '#94a3b8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '1rem',
  }}>
    ⏳ Loading...
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/chat/:roomId" element={<MobileChat />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);