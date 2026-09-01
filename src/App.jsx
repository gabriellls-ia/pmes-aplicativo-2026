import React, { Component, useState } from 'react';
import ClaudePmesApp from '../revisao-pmes-4materias.jsx';
import RemotePmesSimulado from './RemotePmesSimulado.jsx';
import { PMES_ROUNDS } from './pmesRoundCatalog.js';

class ClaudeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { failed: true, message: error?.message || 'Erro inesperado ao carregar o aplicativo.' };
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function FallbackHome({ onOpenSimulados }) {
  return (
    <div style={{ minHeight:'100vh', background:'#14171C', color:'#EDEBE4', padding:'32px 18px', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ padding:22, border:'1px solid #313945', borderRadius:16, background:'#1D222A' }}>
          <div style={{ color:'#98A1B0', fontSize:12, fontWeight:700, letterSpacing:1 }}>PMES • ESTUDOS 2026</div>
          <h1 style={{ margin:'8px 0 10px' }}>Aplicativo de Estudos</h1>
          <p style={{ color:'#98A1B0', lineHeight:1.55 }}>O módulo principal encontrou um erro ao iniciar. Os simulados continuam disponíveis abaixo.</p>
          <button onClick={onOpenSimulados} style={{ marginTop:12, padding:'13px 18px', borderRadius:10, border:'1px solid #313945', background:'#EDEBE4', color:'#14171C', cursor:'pointer', fontWeight:800 }}>Abrir Simulados PMES</button>
        </div>
      </div>
    </div>
  );
}

function RoundsLauncher({ onClose }) {
  const [round, setRound] = useState(null);
  if (round) return <RemotePmesSimulado round={round} onExit={() => setRound(null)} />;
  return (
    <div style={{ minHeight:'100vh', background:'#14171C', color:'#EDEBE4', padding:'24px 16px', overflowY:'auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <button onClick={onClose} style={{ border:0, background:'transparent', color:'#98A1B0', cursor:'pointer', marginBottom:24 }}>← Voltar ao aplicativo</button>
        <h1 style={{ margin:'0 0 8px', fontSize:28 }}>Simulados PMES</h1>
        <p style={{ color:'#98A1B0', lineHeight:1.5, marginTop:0 }}>Rodadas de 80 questões carregadas do banco auditado.</p>
        <div style={{ display:'grid', gap:12, marginTop:24 }}>
          {PMES_ROUNDS.map(r => (
            <button key={r.round} onClick={() => setRound(r.round)} style={{ textAlign:'left', padding:18, borderRadius:14, border:'1px solid #313945', background:'#1D222A', color:'#EDEBE4', cursor:'pointer' }}>
              <div style={{ fontWeight:700, fontSize:17 }}>{r.title}</div>
              <div style={{ marginTop:5, color:'#98A1B0', fontSize:13 }}>{r.subtitle}</div>
              <div style={{ marginTop:8, color:'#5D6472', fontSize:11 }}>{r.source} · Supabase</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RemoteEntry() {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get('rodada'));
  const round = Number.isInteger(value) && value >= 1 && value <= 3 ? value : null;
  const [launcher, setLauncher] = useState(false);
  const openSimulados = () => setLauncher(true);
  if (round) return <RemotePmesSimulado round={round} onExit={() => { window.location.href = window.location.pathname; }} />;
  if (launcher) return <RoundsLauncher onClose={() => setLauncher(false)} />;
  return (
    <>
      <ClaudeBoundary fallback={<FallbackHome onOpenSimulados={openSimulados} />}>
        <ClaudePmesApp />
      </ClaudeBoundary>
      <button onClick={openSimulados} aria-label="Abrir simulados PMES" style={{ position:'fixed', right:16, bottom:16, zIndex:5000, padding:'12px 16px', borderRadius:999, border:'1px solid #313945', background:'#1D222A', color:'#EDEBE4', boxShadow:'0 6px 24px rgba(0,0,0,.35)', cursor:'pointer', fontWeight:700 }}>
        Simulados PMES
      </button>
    </>
  );
}

export default function App() { return <RemoteEntry />; }
