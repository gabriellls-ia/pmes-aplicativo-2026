import React, { Component, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const App = lazy(() => import('./App.jsx'));
const RemotePmesSimulado = lazy(() => import('./RemotePmesSimulado.jsx'));

class BootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <BootstrapFallback /> : this.props.children;
  }
}

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#14171C', color: '#EDEBE4', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <strong>PMES Estudos 2026</strong>
        <div style={{ marginTop: 8, color: '#98A1B0' }}>Carregando…</div>
      </div>
    </div>
  );
}

function BootstrapFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#14171C', color: '#EDEBE4', padding: '32px 18px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ padding: 24, border: '1px solid #313945', borderRadius: 16, background: '#1D222A' }}>
          <div style={{ color: '#98A1B0', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>PMES • ESTUDOS 2026</div>
          <h1 style={{ margin: '8px 0 10px' }}>Aplicativo de Estudos</h1>
          <p style={{ color: '#98A1B0', lineHeight: 1.55 }}>
            O módulo principal não conseguiu iniciar. Os simulados continuam disponíveis.
          </p>
          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            {[1, 2, 3].map((n) => (
              <a key={n} href={`?rodada=${n}`} style={{ display: 'block', textDecoration: 'none', textAlign: 'left', padding: 15, borderRadius: 11, border: '1px solid #313945', background: '#262C36', color: '#EDEBE4', fontWeight: 700 }}>
                Abrir Rodada {n} • 80 questões
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DirectRound({ round }) {
  return (
    <BootErrorBoundary>
      <Suspense fallback={<Loading />}>
        <RemotePmesSimulado round={round} onExit={() => { window.location.href = window.location.pathname; }} />
      </Suspense>
    </BootErrorBoundary>
  );
}

function Root() {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get('rodada'));
  const round = Number.isInteger(value) && value >= 1 && value <= 3 ? value : null;

  // The simulator is deliberately bootstrapped before the monolithic Claude app.
  // This keeps the 3 audited rounds usable even if the legacy app chunk fails.
  if (round) return <DirectRound round={round} />;

  return (
    <BootErrorBoundary>
      <Suspense fallback={<BootstrapFallback />}>
        <App />
      </Suspense>
    </BootErrorBoundary>
  );
}

// Best-effort cleanup of the old PWA service worker/cache that could keep serving a broken shell.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister().catch(() => {}));
  }).catch(() => {});
}
if (typeof caches !== 'undefined') {
  caches.keys?.().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {});
}

createRoot(document.getElementById('root')).render(<Root />);
