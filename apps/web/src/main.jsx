import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgeCheck,
  Gamepad2,
  LogIn,
  RadioTower,
  RefreshCcw,
  RotateCcw,
  Trophy,
  UserRound
} from 'lucide-react';
import {
  defaultAvatar,
  normalizeDisplayName
} from '../../../packages/shared/src/index.js';
import { api, getPlayerToken, setPlayerToken } from './api.js';
import './styles.css';

function useAsyncData(loader, dependencies = []) {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await loader();
      setState({ loading: false, error: '', data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, dependencies);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

function Shell({ children, title = 'Nexus Player Passport' }) {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>{title}</h1>
          <p>Persistent identity, reusable avatar, cross-game stats.</p>
        </div>
        <nav>
          <a href="/player/profile">Profile</a>
          <a href="/operator/cabinets">Operator</a>
        </nav>
      </header>
      {children}
    </main>
  );
}

function AvatarChip({ avatar = defaultAvatar, label, level }) {
  return (
    <div className="avatar-chip" style={{ '--primary': avatar.primaryColor, '--secondary': avatar.secondaryColor }}>
      <div className="avatar-mark">{String(label || 'P').slice(0, 1).toUpperCase()}</div>
      <div>
        <strong>{label}</strong>
        <span>Level {level || 1}</span>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, compact = false }) {
  const [displayName, setDisplayName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const cleanName = normalizeDisplayName(displayName);
      const result = await api.devLogin({
        displayName: cleanName,
        email: contact.includes('@') ? contact : undefined,
        phone: contact && !contact.includes('@') ? contact : undefined
      });
      setPlayerToken(result.playerToken);
      onLogin?.(result);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={compact ? 'panel compact-form' : 'panel'} onSubmit={submit}>
      <label>
        Display name
        <input maxLength="24" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </label>
      <label>
        Email or phone
        <input value={contact} onChange={(event) => setContact(event.target.value)} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="primary-button" disabled={busy || !normalizeDisplayName(displayName)} type="submit">
        <LogIn size={18} />
        {busy ? 'Signing in' : 'Continue'}
      </button>
    </form>
  );
}

function PhoneLoginPage({ sessionId }) {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token'), []);
  const [profile, setProfile] = useState(null);
  const [claim, setClaim] = useState(null);
  const [slot, setSlot] = useState('auto');
  const status = useAsyncData(() => api.getLoginStatus(sessionId), [sessionId]);

  async function claimSlot() {
    const playerId = getPlayerToken();
    const result = await api.claimCabinetSession({
      sessionId,
      token,
      playerId,
      desiredSlot: slot
    });
    setClaim(result);
  }

  return (
    <Shell title="Join Cabinet">
      <section className="login-layout">
        <div className="panel hero-panel">
          <Gamepad2 size={34} />
          <h2>Claim a player slot</h2>
          <p>Sign in on your phone, then choose P1 or P2. The cabinet receives only display name, avatar, level, and active session data.</p>
          {status.data ? (
            <div className="session-meta">
              <span>{status.data.cabinetId}</span>
              <span>{status.data.status}</span>
              <span>{new Date(status.data.expiresAt).toLocaleTimeString()}</span>
            </div>
          ) : null}
        </div>
        {!profile && !getPlayerToken() ? (
          <LoginForm onLogin={setProfile} />
        ) : (
          <div className="panel">
            <AvatarChip
              avatar={(profile?.player || status.data?.player)?.avatar}
              label={(profile?.player || status.data?.player)?.displayName || 'Player'}
              level={(profile?.player || status.data?.player)?.level || 1}
            />
            <div className="slot-row">
              {['auto', 'P1', 'P2'].map((candidate) => (
                <button
                  className={slot === candidate ? 'segmented active' : 'segmented'}
                  key={candidate}
                  onClick={() => setSlot(candidate)}
                  type="button"
                >
                  {candidate}
                </button>
              ))}
            </div>
            <button className="primary-button" disabled={!token || Boolean(claim)} onClick={claimSlot} type="button">
              <BadgeCheck size={18} />
              {claim ? `Claimed ${claim.playerSlot}` : 'Claim cabinet'}
            </button>
          </div>
        )}
      </section>
    </Shell>
  );
}

function ProfilePage() {
  const [avatar, setAvatar] = useState(defaultAvatar);
  const profile = useAsyncData(() => (getPlayerToken() ? api.getProfile() : Promise.resolve(null)), []);
  const stats = useAsyncData(() => (getPlayerToken() ? api.getStats() : Promise.resolve({ stats: [] })), []);
  const leaders = useAsyncData(() => api.getLeaderboards('rush_run'), []);

  useEffect(() => {
    if (profile.data?.player?.avatar) {
      setAvatar(profile.data.player.avatar);
    }
  }, [profile.data]);

  async function saveAvatar() {
    await api.updateAvatar(avatar);
    await profile.refresh();
  }

  if (!getPlayerToken()) {
    return (
      <Shell>
        <section className="login-layout">
          <div className="panel hero-panel">
            <UserRound size={34} />
            <h2>Create a Passport</h2>
            <p>Use a local dev profile for V1 testing. Production OTP or magic link can replace this adapter later.</p>
          </div>
          <LoginForm onLogin={profile.refresh} />
        </section>
      </Shell>
    );
  }

  const player = profile.data?.player;
  return (
    <Shell>
      <section className="profile-grid">
        <div className="panel profile-card">
          {player ? <AvatarChip avatar={player.avatar} label={player.displayName} level={player.level} /> : null}
          <dl className="stat-grid">
            <div><dt>XP</dt><dd>{profile.data?.progression?.xp || 0}</dd></div>
            <div><dt>Plays</dt><dd>{profile.data?.progression?.lifetimePlays || 0}</dd></div>
            <div><dt>Best games</dt><dd>{stats.data?.stats?.length || 0}</dd></div>
          </dl>
        </div>
        <div className="panel">
          <h2>Avatar manifest</h2>
          <div className="avatar-editor">
            <label>Primary <input type="color" value={avatar.primaryColor} onChange={(event) => setAvatar({ ...avatar, primaryColor: event.target.value })} /></label>
            <label>Secondary <input type="color" value={avatar.secondaryColor} onChange={(event) => setAvatar({ ...avatar, secondaryColor: event.target.value })} /></label>
            <label>Frame <input value={avatar.frameId} onChange={(event) => setAvatar({ ...avatar, frameId: event.target.value })} /></label>
            <label>Badge <input value={avatar.badgeId} onChange={(event) => setAvatar({ ...avatar, badgeId: event.target.value })} /></label>
          </div>
          <button className="primary-button" onClick={saveAvatar} type="button">Save avatar</button>
        </div>
        <div className="panel wide">
          <h2><Trophy size={22} /> Rush Run leaderboard</h2>
          <ol className="leaderboard">
            {(leaders.data?.entries || []).map((entry) => (
              <li key={`${entry.playerId}-${entry.score}-${entry.achievedAt}`}>
                <span>{entry.rank}</span>
                <strong>{entry.displayName}</strong>
                <em>{entry.score.toLocaleString()}</em>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Shell>
  );
}

function OperatorPage() {
  const cabinets = useAsyncData(() => api.getOperatorCabinets(), []);
  const events = useAsyncData(() => api.getPassportEvents(), []);
  const clients = useAsyncData(() => api.getAuthClients(), []);
  const [clientName, setClientName] = useState('Demo Auth App');
  const [redirectUri, setRedirectUri] = useState('http://localhost:8080/oauth/callback');
  const [clientSecret, setClientSecret] = useState('');

  async function resetSlot(cabinetId, slot) {
    await api.logoutPlayer(cabinetId, slot);
    await cabinets.refresh();
  }

  async function createClient(event) {
    event.preventDefault();
    const result = await api.registerAuthClient({
      name: clientName,
      redirectUris: [redirectUri],
      allowedScopes: ['passport:profile:read', 'passport:avatar:read', 'passport:stats:read'],
      type: 'public'
    });
    setClientSecret(result.clientSecret || 'public client');
    await clients.refresh();
  }

  return (
    <Shell title="Operator Console">
      <section className="operator-grid">
        <div className="panel wide">
          <div className="panel-header">
            <h2><RadioTower size={22} /> Cabinets</h2>
            <button className="icon-button" onClick={cabinets.refresh} title="Refresh" type="button"><RefreshCcw size={18} /></button>
          </div>
          <div className="cabinet-list">
            {(cabinets.data?.cabinets || []).map((cabinet) => (
              <article className="cabinet-row" key={cabinet.cabinetId}>
                <div>
                  <strong>{cabinet.cabinetId}</strong>
                  <span>{cabinet.siteId} · {cabinet.status} · {cabinet.lastState || 'idle'}</span>
                </div>
                <div className="slot-actions">
                  {['P1', 'P2'].map((slot) => (
                    <button className="secondary-button" key={slot} onClick={() => resetSlot(cabinet.cabinetId, slot)} type="button">
                      <RotateCcw size={16} /> {slot}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Passport events</h2>
          <ul className="event-list">
            {(events.data?.events || []).map((event) => (
              <li key={`${event.type}-${event.occurredAt}`}>
                <strong>{event.type}</strong>
                <span>{event.playerId || event.cabinetId || 'system'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel wide">
          <h2>OAuth clients</h2>
          <form className="client-form" onSubmit={createClient}>
            <label>Name <input value={clientName} onChange={(event) => setClientName(event.target.value)} /></label>
            <label>Redirect URI <input value={redirectUri} onChange={(event) => setRedirectUri(event.target.value)} /></label>
            <button className="primary-button" type="submit">Register client</button>
          </form>
          {clientSecret ? <p className="client-secret">Secret: {clientSecret}</p> : null}
          <div className="cabinet-list">
            {(clients.data?.clients || []).map((client) => (
              <article className="cabinet-row" key={client.clientId}>
                <div>
                  <strong>{client.name}</strong>
                  <span>{client.clientId} · {client.type} · {client.allowedScopes.join(' ')}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function App() {
  const path = window.location.pathname;
  if (path.startsWith('/play/login/')) {
    return <PhoneLoginPage sessionId={path.split('/').pop()} />;
  }
  if (path.startsWith('/operator/cabinets')) {
    return <OperatorPage />;
  }
  return <ProfilePage />;
}

createRoot(document.getElementById('root')).render(<App />);
