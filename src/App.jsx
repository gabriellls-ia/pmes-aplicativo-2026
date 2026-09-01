import React, { useState } from 'react';
import ClaudePmesApp from '../revisao-pmes-4materias.jsx';
import RemotePmesSimulado from './RemotePmesSimulado.jsx';
import { PMES_ROUNDS } from './pmesRoundCatalog.js';

function RoundsLauncher({ onClose }) {
  const [round, setRound] = useState(null);
  if (round) return <RemotePmesSimulado round={round} onExit={() => setRound(null)} />;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#14171C', color:'#EDEBE4', padding:'24px 16px', overflowY:'auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <button onClick={onClose} style={{ border:0, background:'transparent', color:'#98A1B0', cursor:'pointer', marginBottom:24 }}>← Voltar ao aplicativo</button>
        <h1 style={{ margin:'0 0 8px', fontSize:28 }}>Simulados PMES</h1>
        <p style={{ color:'#98A1B0', lineHeight:1.5, marginTop:0 }}>Rodadas de 80 questões carregadas do banco auditado. As questões permanecem separadas do treino autoral.</p>
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
  if (round) return <RemotePmesSimulado round={round} onExit={() => { window.location.href = window.location.pathname; }} />;
  if (launcher) return <RoundsLauncher onClose={() => setLauncher(false)} />;
  return (
    <>
      <ClaudePmesApp />
      <button onClick={() => setLauncher(true)} aria-label="Abrir simulados PMES" style={{ position:'fixed', right:16, bottom:16, zIndex:5000, padding:'12px 16px', borderRadius:999, border:'1px solid #313945', background:'#1D222A', color:'#EDEBE4', boxShadow:'0 6px 24px rgba(0,0,0,.35)', cursor:'pointer', fontWeight:700 }}>
        Simulados PMES
      </button>
    </>
  );
}

export default function App() { return <RemoteEntry />; }
