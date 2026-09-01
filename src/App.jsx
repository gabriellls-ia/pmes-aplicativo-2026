import React from 'react';
import ClaudePmesApp from '../revisao-pmes-4materias.jsx';
import RemotePmesSimulado from './RemotePmesSimulado.jsx';

// The original Claude app remains the default experience. The remote PMES
// round simulator is opt-in so this integration cannot disturb the existing UI.
function RemoteEntry() {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get('rodada'));
  const round = Number.isInteger(value) && value >= 1 && value <= 3 ? value : null;
  if (!round) return <ClaudePmesApp />;
  return <RemotePmesSimulado round={round} onExit={() => { window.location.href = window.location.pathname; }} />;
}

export default function App() {
  return <RemoteEntry />;
}
