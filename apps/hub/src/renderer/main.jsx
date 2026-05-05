import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Gamepad2,
  MonitorCog,
  Power,
  QrCode,
  RefreshCcw,
  Rocket,
  UserRound
} from 'lucide-react';
import './styles.css';

function useInterval(callback, delay) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}

function PlayerPanel({ slot, player }) {
  return (
    <article className={player ? 'player-panel active' : 'player-panel'}>
      <div className="slot-label">{slot}</div>
      {player ? (
        <>
          <div className="avatar" style={{ '--primary': player.avatar?.primaryColor, '--secondary': player.avatar?.secondaryColor }}>
            {player.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h3>{player.displayName}</h3>
            <p>Level {player.level}</p>
          </div>
        </>
      ) : (
        <div>
          <h3>Guest Ready</h3>
          <p>Scan to load Player Passport</p>
        </div>
      )}
    </article>
  );
}

function HubApp() {
  const [config, setConfig] = useState(null);
  const [loginSession, setLoginSession] = useState(null);
  const [activePlayers, setActivePlayers] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [status, setStatus] = useState('Attract mode');
  const [operatorOpen, setOperatorOpen] = useState(false);

  const bySlot = useMemo(() => Object.fromEntries(activePlayers.map((player) => [player.slot, player])), [activePlayers]);

  const refreshPlayers = useCallback(async () => {
    const response = await window.nexusHub.getActivePlayers();
    setActivePlayers(response.activePlayers || []);
  }, []);

  async function createLogin(desiredSlot = 'auto') {
    setStatus('Creating QR login');
    const session = await window.nexusHub.createLoginSession(desiredSlot);
    setLoginSession(session);
    setStatus((session.qrWarnings || []).length ? session.qrWarnings[0] : `Pairing code ${session.pairingCode}`);
  }

  async function launchNexusRelay() {
    setStatus('Launching Nexus Relay');
    const launch = await window.nexusHub.launchNexusRelay();
    setStatus(launch.usingGodotProject ? 'Nexus Relay Godot project launched' : launch.usingSimulator ? 'Nexus Relay simulator launched' : 'Nexus Relay launched');
  }

  async function resetSlot(slot) {
    await window.nexusHub.logoutPlayer(slot);
    await refreshPlayers();
  }

  async function loadDiagnostics() {
    const response = await window.nexusHub.diagnostics();
    setDiagnostics(response);
  }

  useEffect(() => {
    window.nexusHub.getConfig().then(setConfig);
    refreshPlayers();
    createLogin('auto').catch((error) => setStatus(error.message));
  }, [refreshPlayers]);

  useInterval(() => {
    refreshPlayers().catch(() => {});
    window.nexusHub.heartbeat(operatorOpen ? 'operator' : 'attract').catch(() => {});
  }, 5000);

  return (
    <main className="hub-shell">
      <header className="hub-header">
        <div>
          <h1>Nexus Arcade Hub</h1>
          <p>Scan in, load your avatars, launch adaptive 3D missions.</p>
        </div>
        <button className="icon-button" onClick={() => setOperatorOpen((value) => !value)} title="Operator menu" type="button">
          <MonitorCog />
        </button>
      </header>

      <section className="hero-band">
        <div className="qr-panel">
          <div className="qr-title">
            <QrCode />
            <span>{loginSession?.pairingCode || 'PAIRING'}</span>
          </div>
          {loginSession?.qrDataUrl ? <img alt="Player Passport QR" src={loginSession.qrDataUrl} /> : <div className="qr-placeholder">QR</div>}
          {loginSession?.qrUrl ? <p className={loginSession.qrWarnings?.length ? 'qr-url warning' : 'qr-url'}>{loginSession.qrUrl}</p> : null}
          <button className="primary-button" onClick={() => createLogin('auto')} type="button">
            <RefreshCcw size={20} /> New QR
          </button>
        </div>
        <div className="attract-copy">
          <h2>Player Passport</h2>
          <p>Launch solo or let a second player join during the Nexus Relay countdown.</p>
          <div className="status-strip">{status}</div>
          <button className="launch-button" onClick={launchNexusRelay} type="button">
            <Rocket size={26} /> Launch Nexus Relay
          </button>
        </div>
      </section>

      <section className="player-grid">
        <PlayerPanel slot="P1" player={bySlot.P1} />
        <PlayerPanel slot="P2" player={bySlot.P2} />
      </section>

      {operatorOpen ? (
        <section className="operator-drawer">
          <div className="drawer-header">
            <h2><MonitorCog size={24} /> Operator</h2>
            <button className="secondary-button" onClick={loadDiagnostics} type="button">Run diagnostics</button>
          </div>
          <div className="operator-grid">
            <button onClick={() => resetSlot('P1')} type="button"><Power size={18} /> Reset P1</button>
            <button onClick={() => resetSlot('P2')} type="button"><Power size={18} /> Reset P2</button>
            <button onClick={() => window.nexusHub.flushSyncQueue().then((result) => setStatus(`Synced ${result.synced.length}`))} type="button">
              <RefreshCcw size={18} /> Flush queue
            </button>
            <button onClick={refreshPlayers} type="button"><UserRound size={18} /> Refresh players</button>
          </div>
          {diagnostics ? (
            <dl className="diagnostics">
              {Object.entries(diagnostics).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      <footer>
        <Gamepad2 size={18} />
        <span>{config?.cabinetId} - {config?.siteId} - {config?.hasNexusRelayPath ? 'Nexus Relay export configured' : config?.hasNexusRelayProject ? 'Godot project launch available' : 'Simulator fallback available'}</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<HubApp />);
