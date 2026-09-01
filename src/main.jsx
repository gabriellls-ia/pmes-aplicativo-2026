import React, { lazy, Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './storage-polyfill.js';
import './styles.css';

const App = lazy(() => import('./App.jsx'));
const RemotePmesSimulado = lazy(() => import('./RemotePmesSimulado.jsx'));

function BootstrapFallback() {
  const [round, setRound] = useState(null);
  if (round) {
    return (
      <Suspense fallback={<Loading />}> 
        <RemotePmesSimulado round={round} onExit={() => setRound(null)} />
      </Suspense>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#14171C', color:'#EDEBE4', padding:'32px 18px', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ padding:24, border:'1px solid #313945', borderRadius:16, background:'#1D222A' }}>
          <div style={{ color:'#98A1B0', fontSize:12, fontWeight:700, letterSpacing:1 }}>PMES • ESTUDOS 2026</div>
          <h1 style={{ margin:'8px 0 10px' }}>Aplicativo de Estudos</h1>
          <p style={{ color:'#98A1B0', lineHeight:1.55 }}>
            O módulo principal não conseguiu iniciar. O acesso aos simulados continua disponível.
          </p>
          <div style={{ display:'grid', gap:10, marginTop:18 }}>
            {[1,2,3].map((n) => (
              <button key={n} onClick={() => setRound(n)} style={{ textAlign:'left', padding:15, borderRadius:11, border:'1px solid #313945', background:'#262C36', color:'#EDEBE4', cursor:'pointer', fontWeight:700 }}>
                Abrir Rodada {n} • 80 questões
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#14171C', color:'#EDEBE4', fontFamily:'system-ui,sans-serif' }}>Carregando…</div>;
}

function Root() {
  return (
    <Suspense fallback={<BootstrapFallback />}>
      <App />
    </Suspense>
  );
}

createRoot(document.getElementById('root')).render(<Root />);
