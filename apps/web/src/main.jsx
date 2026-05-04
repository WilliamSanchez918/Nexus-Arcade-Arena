import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import {
  BadgeCheck,
  Box,
  Gamepad2,
  LogIn,
  LogOut,
  Palette,
  RadioTower,
  RefreshCcw,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound
} from 'lucide-react';
import {
  AVATAR_EQUIPMENT_SLOTS,
  defaultAvatar,
  normalizeDisplayName
} from '../../../packages/shared/src/index.js';
import {
  api,
  clearOperatorToken,
  clearPlayerToken,
  getOperatorToken,
  getPlayerToken,
  setOperatorToken,
  setPlayerToken
} from './api.js';
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
  const hasPlayerToken = Boolean(getPlayerToken());
  const hasOperatorToken = Boolean(getOperatorToken());

  function signOut() {
    clearPlayerToken();
    clearOperatorToken();
    window.location.reload();
  }

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
          {hasPlayerToken || hasOperatorToken ? (
            <button className="nav-button" onClick={signOut} type="button">
              <LogOut size={17} />
              Sign out
            </button>
          ) : null}
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
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
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
      setChallenge(result);
      setCode(result.devCode || '');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.verifyPlayerTwoFactor({
        challengeId: challenge.challengeId,
        code
      });
      setPlayerToken(result.playerToken);
      onLogin?.(result);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  if (challenge) {
    return (
      <form className={compact ? 'panel compact-form two-factor-card' : 'panel two-factor-card'} onSubmit={verify}>
        <ShieldCheck size={32} />
        <h2>Verify sign-in</h2>
        <p>Enter the 6-digit code for {challenge.delivery.destination}. This code expires at {new Date(challenge.expiresAt).toLocaleTimeString()}.</p>
        {challenge.devCode ? <p className="code-hint">Local dev code: <strong>{challenge.devCode}</strong></p> : null}
        <label>
          2FA code
          <input inputMode="numeric" maxLength="6" pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary-button" disabled={busy || code.length !== 6} type="submit">
          <ShieldCheck size={18} />
          {busy ? 'Verifying' : 'Verify and continue'}
        </button>
      </form>
    );
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

const avatarSlotLabels = Object.freeze({
  body: 'Body',
  head: 'Head',
  helmet: 'Helmet',
  visor: 'Visor',
  outfit: 'Outfit',
  back: 'Back',
  trail: 'Trail',
  aura: 'Aura',
  frame: 'Frame',
  badge: 'Badge',
  pose: 'Pose'
});

function groupCatalogItems(items = []) {
  return items.reduce((groups, item) => {
    const slot = item.slot || item.type;
    groups[slot] = groups[slot] || [];
    groups[slot].push(item);
    return groups;
  }, {});
}

function AvatarModel({ avatar = defaultAvatar }) {
  const groupRef = useRef(null);
  const primary = avatar.primaryColor || defaultAvatar.primaryColor;
  const secondary = avatar.secondaryColor || defaultAvatar.secondaryColor;
  const accent = avatar.accentColor || defaultAvatar.accentColor;
  const isAndroid = avatar.bodyType === 'android' || avatar.bodyId === 'body_android_prime';
  const hasBoostPack = avatar.backId === 'back_boost_pack';
  const hasAura = avatar.auraId === 'aura_electric';
  const hasCrown = avatar.helmetId === 'helmet_champion_crown';
  const hasPrismVisor = avatar.visorId === 'visor_prism';

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.28;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.7) * 0.035;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.65, 0]}>
      {hasAura ? (
        <mesh position={[0, 0.95, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.08, 0.018, 12, 72]} />
          <meshBasicMaterial color={secondary} transparent opacity={0.48} />
        </mesh>
      ) : null}
      {hasBoostPack ? (
        <group position={[0, 0.35, -0.34]}>
          <mesh>
            <boxGeometry args={[0.44, 0.78, 0.18]} />
            <meshStandardMaterial color="#182235" roughness={0.42} metalness={0.35} />
          </mesh>
          <mesh position={[-0.14, -0.46, -0.03]}>
            <coneGeometry args={[0.08, 0.32, 18]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.3} />
          </mesh>
          <mesh position={[0.14, -0.46, -0.03]}>
            <coneGeometry args={[0.08, 0.32, 18]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.3} />
          </mesh>
        </group>
      ) : null}
      <mesh position={[0, 0.15, 0]}>
        <capsuleGeometry args={[isAndroid ? 0.38 : 0.34, isAndroid ? 0.96 : 1.08, 8, 18]} />
        <meshStandardMaterial color={primary} roughness={0.26} metalness={0.28} />
      </mesh>
      <mesh position={[0, 0.26, 0.28]}>
        <boxGeometry args={[0.5, 0.52, 0.08]} />
        <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.28} />
      </mesh>
      <mesh position={[-0.52, 0.18, 0]}>
        <capsuleGeometry args={[0.1, 0.7, 7, 12]} />
        <meshStandardMaterial color={secondary} roughness={0.34} metalness={0.18} />
      </mesh>
      <mesh position={[0.52, 0.18, 0]}>
        <capsuleGeometry args={[0.1, 0.7, 7, 12]} />
        <meshStandardMaterial color={secondary} roughness={0.34} metalness={0.18} />
      </mesh>
      <mesh position={[-0.2, -0.88, 0]}>
        <capsuleGeometry args={[0.11, 0.86, 7, 12]} />
        <meshStandardMaterial color="#101827" roughness={0.4} metalness={0.22} />
      </mesh>
      <mesh position={[0.2, -0.88, 0]}>
        <capsuleGeometry args={[0.11, 0.86, 7, 12]} />
        <meshStandardMaterial color="#101827" roughness={0.4} metalness={0.22} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.33, 32, 24]} />
        <meshStandardMaterial color={avatar.headId === 'head_arcade_star' ? accent : primary} roughness={0.18} metalness={0.34} />
      </mesh>
      <mesh position={[0, 1.13, 0.28]}>
        <boxGeometry args={[0.52, 0.12, 0.08]} />
        <meshStandardMaterial color={hasPrismVisor ? accent : '#d7fbff'} emissive={hasPrismVisor ? secondary : '#00e5ff'} emissiveIntensity={0.42} transparent opacity={0.88} />
      </mesh>
      {avatar.helmetId !== 'helmet_vector' ? null : (
        <mesh position={[0, 1.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.035, 10, 48]} />
          <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.35} />
        </mesh>
      )}
      {hasCrown ? (
        <group position={[0, 1.45, 0]}>
          {[-0.2, 0, 0.2].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <coneGeometry args={[0.08, 0.28, 5]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      ) : null}
      {avatar.trailId === 'trail_comet' || avatar.trailId === 'trail_neon' ? (
        <mesh position={[0, -1.35, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.02, 10, 60]} />
          <meshBasicMaterial color={avatar.trailId === 'trail_comet' ? accent : primary} transparent opacity={0.58} />
        </mesh>
      ) : null}
    </group>
  );
}

function AvatarPreview3D({ avatar }) {
  return (
    <div className="avatar-canvas" style={{ '--primary': avatar.primaryColor, '--secondary': avatar.secondaryColor }}>
      <Canvas camera={{ position: [0, 0.6, 4], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={['#08101e']} />
        <ambientLight intensity={0.8} />
        <directionalLight color="#ffffff" intensity={2.4} position={[3, 5, 4]} />
        <pointLight color={avatar.secondaryColor} intensity={3.2} position={[-2, 1.5, 2]} />
        <Suspense fallback={null}>
          <AvatarModel avatar={avatar} />
          <ContactShadows blur={2.8} far={4} opacity={0.32} position={[0, -1.72, 0]} scale={4} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
    </div>
  );
}

function CatalogItemButton({ item, equippedId, owned, onEquip, busy }) {
  const active = equippedId === item.cosmeticId;
  return (
    <button
      className={active ? 'catalog-item active' : 'catalog-item'}
      disabled={!owned || busy}
      onClick={() => onEquip(item.slot, item.cosmeticId)}
      type="button"
    >
      <span className="catalog-swatch" style={{ '--swatch': item.preview?.swatch || '#00E5FF' }} />
      <strong>{item.title}</strong>
      <em>{owned ? (active ? 'Equipped' : item.rarity) : 'Locked'}</em>
    </button>
  );
}

function ProfilePage() {
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [saveState, setSaveState] = useState('');
  const [equipState, setEquipState] = useState('');
  const profile = useAsyncData(() => (getPlayerToken() ? api.getProfile() : Promise.resolve(null)), []);
  const catalog = useAsyncData(() => api.getAvatarCatalog(), []);
  const inventory = useAsyncData(() => (getPlayerToken() ? api.getInventory() : Promise.resolve({ inventory: null })), []);
  const stats = useAsyncData(() => (getPlayerToken() ? api.getStats() : Promise.resolve({ stats: [] })), []);
  const leaders = useAsyncData(() => api.getLeaderboards('rush_run'), []);

  useEffect(() => {
    if (profile.data?.player?.avatar) {
      setAvatar(profile.data.player.avatar);
    }
  }, [profile.data]);

  function updateAvatarDraft(changes) {
    setSaveState('');
    setAvatar((current) => ({ ...current, ...changes }));
  }

  async function saveAvatar() {
    setSaveState('Saving');
    try {
      const result = await api.updateAvatar(avatar);
      setAvatar(result.player.avatar);
      await profile.refresh();
      setSaveState('Saved');
    } catch (error) {
      setSaveState(error.message);
    }
  }

  async function equipCosmetic(slot, cosmeticId) {
    setEquipState(`${slot}:${cosmeticId}`);
    try {
      const result = await api.equipCosmetic(slot, cosmeticId);
      setAvatar(result.player.avatar);
      await Promise.all([profile.refresh(), inventory.refresh()]);
    } finally {
      setEquipState('');
    }
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
          <LoginForm onLogin={() => { profile.refresh(); inventory.refresh(); }} />
        </section>
      </Shell>
    );
  }

  const player = profile.data?.player;
  const catalogBySlot = groupCatalogItems(catalog.data?.items || []);
  const ownedIds = new Set((inventory.data?.inventory?.cosmetics || []).map((item) => item.cosmeticId));
  const equipped = inventory.data?.inventory?.equipped || {};
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
        <div className="panel passport-card">
          <h2><Star size={22} /> Passport</h2>
          <dl className="passport-fields">
            <div><dt>Player ID</dt><dd>{player?.playerId}</dd></div>
            <div><dt>Avatar ID</dt><dd>{avatar.avatarId}</dd></div>
            <div><dt>OAuth scopes</dt><dd>profile avatar stats</dd></div>
          </dl>
        </div>
        <div className="panel wide builder-panel">
          <div>
            <h2><Box size={22} /> Avatar builder</h2>
            <AvatarPreview3D avatar={avatar} />
          </div>
          <div className="builder-controls">
            <h3><Palette size={18} /> Color masks</h3>
            <div className="avatar-editor">
              <label>Primary <input type="color" value={avatar.primaryColor} onChange={(event) => updateAvatarDraft({ primaryColor: event.target.value })} /></label>
              <label>Secondary <input type="color" value={avatar.secondaryColor} onChange={(event) => updateAvatarDraft({ secondaryColor: event.target.value })} /></label>
              <label>Accent <input type="color" value={avatar.accentColor || defaultAvatar.accentColor} onChange={(event) => updateAvatarDraft({ accentColor: event.target.value })} /></label>
              <label>Avatar name <input maxLength="40" value={avatar.avatarId} onChange={(event) => updateAvatarDraft({ avatarId: event.target.value })} /></label>
            </div>
            <button className="primary-button" onClick={saveAvatar} type="button">
              <Save size={18} />
              {saveState || 'Save avatar'}
            </button>
          </div>
        </div>
        <div className="panel wide">
          <div className="panel-header">
            <h2><Sparkles size={22} /> Avatar add-ons</h2>
            <button className="icon-button" onClick={() => { catalog.refresh(); inventory.refresh(); }} title="Refresh catalog" type="button"><RefreshCcw size={18} /></button>
          </div>
          <div className="catalog-slots">
            {AVATAR_EQUIPMENT_SLOTS.map((slot) => (
              <section className="catalog-slot" key={slot}>
                <h3>{avatarSlotLabels[slot] || slot}</h3>
                <div className="catalog-items">
                  {(catalogBySlot[slot] || []).map((item) => (
                    <CatalogItemButton
                      busy={equipState === `${slot}:${item.cosmeticId}`}
                      equippedId={equipped[slot]}
                      item={item}
                      key={item.cosmeticId}
                      onEquip={equipCosmetic}
                      owned={ownedIds.has(item.cosmeticId)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
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

function OperatorLoginForm({ onLogin }) {
  const [operatorId, setOperatorId] = useState('operator');
  const [pin, setPin] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function start(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.operatorLogin({ operatorId, pin });
      setChallenge(result);
      setCode(result.devCode || '');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.verifyOperatorTwoFactor({
        challengeId: challenge.challengeId,
        code
      });
      setOperatorToken(result.operatorToken);
      onLogin?.(result);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  if (challenge) {
    return (
      <form className="panel two-factor-card" onSubmit={verify}>
        <ShieldCheck size={32} />
        <h2>Operator 2FA</h2>
        <p>Operator tools require a verified session. Enter the 6-digit code for {challenge.delivery.destination}.</p>
        {challenge.devCode ? <p className="code-hint">Local dev code: <strong>{challenge.devCode}</strong></p> : null}
        <label>
          2FA code
          <input inputMode="numeric" maxLength="6" pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary-button" disabled={busy || code.length !== 6} type="submit">
          <ShieldCheck size={18} />
          {busy ? 'Verifying' : 'Verify operator'}
        </button>
      </form>
    );
  }

  return (
    <form className="panel" onSubmit={start}>
      <label>
        Operator ID
        <input value={operatorId} onChange={(event) => setOperatorId(event.target.value)} />
      </label>
      <label>
        Operator PIN
        <input type="password" value={pin} onChange={(event) => setPin(event.target.value)} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="primary-button" disabled={busy || !operatorId || !pin} type="submit">
        <LogIn size={18} />
        {busy ? 'Checking' : 'Continue'}
      </button>
    </form>
  );
}

function secondsToMinutesLabel(seconds) {
  return `${Math.round(Number(seconds || 0) / 60)} min`;
}

function OperatorConfigPanel({ configState }) {
  const [draft, setDraft] = useState(null);
  const [saveState, setSaveState] = useState('');

  useEffect(() => {
    if (configState.data?.config) {
      setDraft(configState.data.config);
    }
  }, [configState.data]);

  function updateDraft(section, field, value) {
    setSaveState('');
    setDraft((current) => ({
      ...current,
      [section]: {
        ...(current?.[section] || {}),
        [field]: value
      }
    }));
  }

  async function saveConfig(event) {
    event.preventDefault();
    setSaveState('Saving');
    try {
      const result = await api.updateOperatorConfig({
        general: draft.general,
        security: {
          twoFactorTtlSeconds: Number(draft.security.twoFactorTtlSeconds),
          twoFactorMaxAttempts: Number(draft.security.twoFactorMaxAttempts),
          exposeDevTwoFactorCodes: Boolean(draft.security.exposeDevTwoFactorCodes),
          operatorSessionTtlSeconds: Number(draft.security.operatorSessionTtlSeconds)
        },
        qr: {
          qrTokenTtlSeconds: Number(draft.qr.qrTokenTtlSeconds)
        },
        oauth: draft.oauth
      });
      setDraft(result.config);
      await configState.refresh();
      setSaveState('Saved');
    } catch (error) {
      setSaveState(error.message);
    }
  }

  if (configState.loading || !draft) {
    return (
      <div className="panel wide">
        <h2><Settings size={22} /> Configuration</h2>
        <p className="muted-copy">Loading operator configuration...</p>
      </div>
    );
  }

  return (
    <form className="panel wide config-panel" onSubmit={saveConfig}>
      <div className="panel-header">
        <h2><Settings size={22} /> Configuration</h2>
        <button className="icon-button" onClick={configState.refresh} title="Reload configuration" type="button"><RefreshCcw size={18} /></button>
      </div>
      <div className="config-summary">
        <div><strong>Player 2FA</strong><span>Required</span></div>
        <div><strong>Operator 2FA</strong><span>Required</span></div>
        <div><strong>QR TTL</strong><span>{secondsToMinutesLabel(draft.qr.qrTokenTtlSeconds)}</span></div>
        <div><strong>Operator session</strong><span>{secondsToMinutesLabel(draft.security.operatorSessionTtlSeconds)}</span></div>
      </div>
      <section className="config-section">
        <h3>Site defaults</h3>
        <div className="config-grid">
          <label>Site ID <input value={draft.general.siteId} onChange={(event) => updateDraft('general', 'siteId', event.target.value)} /></label>
          <label>Default cabinet <input value={draft.general.cabinetId} onChange={(event) => updateDraft('general', 'cabinetId', event.target.value)} /></label>
          <label>App base URL <input value={draft.general.appBaseUrl} onChange={(event) => updateDraft('general', 'appBaseUrl', event.target.value)} /></label>
          <label>API base URL <input value={draft.general.apiBaseUrl} onChange={(event) => updateDraft('general', 'apiBaseUrl', event.target.value)} /></label>
        </div>
      </section>
      <section className="config-section">
        <h3>Security policy</h3>
        <div className="config-grid">
          <label>2FA code TTL seconds <input min="60" max="1800" type="number" value={draft.security.twoFactorTtlSeconds} onChange={(event) => updateDraft('security', 'twoFactorTtlSeconds', event.target.value)} /></label>
          <label>2FA max attempts <input min="1" max="10" type="number" value={draft.security.twoFactorMaxAttempts} onChange={(event) => updateDraft('security', 'twoFactorMaxAttempts', event.target.value)} /></label>
          <label>Operator session seconds <input min="900" max="86400" type="number" value={draft.security.operatorSessionTtlSeconds} onChange={(event) => updateDraft('security', 'operatorSessionTtlSeconds', event.target.value)} /></label>
          <label className="toggle-row">
            <input checked={Boolean(draft.security.exposeDevTwoFactorCodes)} type="checkbox" onChange={(event) => updateDraft('security', 'exposeDevTwoFactorCodes', event.target.checked)} />
            Show local dev 2FA codes
          </label>
        </div>
        <p className="muted-copy">Player and operator 2FA are enforced by policy and cannot be disabled from this pilot console.</p>
      </section>
      <section className="config-section">
        <h3>QR and integration</h3>
        <div className="config-grid">
          <label>QR token TTL seconds <input min="60" max="1800" type="number" value={draft.qr.qrTokenTtlSeconds} onChange={(event) => updateDraft('qr', 'qrTokenTtlSeconds', event.target.value)} /></label>
          <label>OAuth issuer <input value={draft.oauth.issuer} onChange={(event) => updateDraft('oauth', 'issuer', event.target.value)} /></label>
        </div>
      </section>
      {saveState ? <p className="client-secret">{saveState}</p> : null}
      <button className="primary-button" type="submit">
        <Save size={18} />
        Save configuration
      </button>
    </form>
  );
}

function OperatorWorkspace() {
  const cabinets = useAsyncData(() => api.getOperatorCabinets(), []);
  const events = useAsyncData(() => api.getPassportEvents(), []);
  const clients = useAsyncData(() => api.getAuthClients(), []);
  const operatorConfig = useAsyncData(() => api.getOperatorConfig(), []);
  const [activeView, setActiveView] = useState(() => {
    if (window.location.pathname.includes('/operator/config')) {
      return 'configuration';
    }
    if (window.location.pathname.includes('/operator/integrations')) {
      return 'integrations';
    }
    return 'operations';
  });
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

  function selectOperatorView(view) {
    setActiveView(view);
    const path = view === 'operations' ? '/operator/cabinets' : `/operator/${view}`;
    window.history.replaceState({}, '', path);
  }

  return (
    <Shell title="Operator Console">
      <div className="management-tabs" role="tablist" aria-label="Operator console sections">
        {[
          ['operations', 'Operations', RadioTower],
          ['configuration', 'Configuration', Settings],
          ['integrations', 'Integrations', ShieldCheck]
        ].map(([view, label, Icon]) => (
          <button
            className={activeView === view ? 'segmented active' : 'segmented'}
            key={view}
            onClick={() => selectOperatorView(view)}
            type="button"
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      <section className="operator-grid">
        {activeView === 'operations' ? (
          <>
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
                      <span>{cabinet.siteId} - {cabinet.status} - {cabinet.lastState || 'idle'}</span>
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
          </>
        ) : null}
        {activeView === 'configuration' ? (
          <OperatorConfigPanel configState={operatorConfig} />
        ) : null}
        {activeView === 'integrations' ? (
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
                    <span>{client.clientId} - {client.type} - {client.allowedScopes.join(' ')}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </Shell>
  );
}

function OperatorPage() {
  const [operatorReady, setOperatorReady] = useState(Boolean(getOperatorToken()));

  if (!operatorReady) {
    return (
      <Shell title="Operator Login">
        <section className="login-layout">
          <div className="panel hero-panel">
            <ShieldCheck size={34} />
            <h2>Operator access</h2>
            <p>Cabinet operations, Passport events, and auth-client management require an operator session with 2FA.</p>
          </div>
          <OperatorLoginForm onLogin={() => setOperatorReady(true)} />
        </section>
      </Shell>
    );
  }

  return <OperatorWorkspace />;
}

function App() {
  const path = window.location.pathname;
  if (path.startsWith('/play/login/')) {
    return <PhoneLoginPage sessionId={path.split('/').pop()} />;
  }
  if (path.startsWith('/operator')) {
    return <OperatorPage />;
  }
  return <ProfilePage />;
}

createRoot(document.getElementById('root')).render(<App />);
