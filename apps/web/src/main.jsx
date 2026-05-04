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
  hair: 'Hair',
  helmet: 'Helmet',
  visor: 'Visor',
  outfit: 'Outfit',
  boots: 'Boots',
  back: 'Back',
  trail: 'Trail',
  aura: 'Aura',
  frame: 'Frame',
  badge: 'Badge',
  pose: 'Pose',
  emote: 'Emote'
});

function groupCatalogItems(items = []) {
  return items.reduce((groups, item) => {
    const slot = item.slot || item.type;
    groups[slot] = groups[slot] || [];
    groups[slot].push(item);
    return groups;
  }, {});
}

const avatarFieldBySlot = Object.freeze({
  body: 'bodyId',
  head: 'headId',
  hair: 'hairId',
  helmet: 'helmetId',
  visor: 'visorId',
  outfit: 'outfitId',
  boots: 'bootsId',
  back: 'backId',
  trail: 'trailId',
  aura: 'auraId',
  frame: 'frameId',
  badge: 'badgeId',
  pose: 'poseId',
  emote: 'emoteId'
});

const bodyTypeByCosmeticId = Object.freeze({
  body_neon_hero: 'hero',
  body_runner_core: 'runner',
  body_street_legend: 'street',
  body_synth_athlete: 'runner',
  body_android_prime: 'android',
  body_guardian_frame: 'guardian'
});

const avatarColorways = Object.freeze([
  ['#00E5FF', '#FF2ED1', '#FFD400'],
  ['#25FF9A', '#8B2CFF', '#00E5FF'],
  ['#FF2ED1', '#FFD400', '#25FF9A'],
  ['#8B2CFF', '#00E5FF', '#FF4545'],
  ['#FFD400', '#25FF9A', '#FF2ED1']
]);

function randomFrom(items = []) {
  return items[Math.floor(Math.random() * items.length)];
}

function avatarValueForSlot(slot, cosmeticId) {
  if (slot === 'badge') {
    return cosmeticId.replace(/^badge_/, '');
  }
  if (slot === 'pose') {
    return cosmeticId.replace(/^pose_/, '');
  }
  if (slot === 'emote') {
    return cosmeticId;
  }
  return cosmeticId;
}

const avatarBodyProfiles = Object.freeze({
  body_neon_hero: { shoulder: 0.56, waist: 0.34, torsoHeight: 1.02, armLength: 0.86, legLength: 1.06, headScale: 0.94, bulk: 1, stance: 0.23, torsoStyle: 'hero' },
  body_runner_core: { shoulder: 0.48, waist: 0.34, torsoHeight: 0.96, armLength: 0.82, legLength: 1.12, headScale: 0.9, bulk: 0.88, stance: 0.2, torsoStyle: 'runner' },
  body_street_legend: { shoulder: 0.52, waist: 0.38, torsoHeight: 0.98, armLength: 0.84, legLength: 1.08, headScale: 0.92, bulk: 0.92, stance: 0.22, torsoStyle: 'street' },
  body_synth_athlete: { shoulder: 0.5, waist: 0.32, torsoHeight: 1, armLength: 0.86, legLength: 1.18, headScale: 0.9, bulk: 0.94, stance: 0.24, torsoStyle: 'athlete' },
  body_android_prime: { shoulder: 0.6, waist: 0.42, torsoHeight: 1.04, armLength: 0.88, legLength: 1.08, headScale: 0.88, bulk: 1.08, stance: 0.24, torsoStyle: 'android' },
  body_guardian_frame: { shoulder: 0.66, waist: 0.5, torsoHeight: 1.06, armLength: 0.9, legLength: 1.04, headScale: 0.92, bulk: 1.18, stance: 0.29, torsoStyle: 'guardian' }
});

const avatarPoseProfiles = Object.freeze({
  idle: { lean: 0, leftArm: -0.2, rightArm: 0.2, leftLeg: -0.07, rightLeg: 0.07, handY: -0.88 },
  power: { lean: 0, leftArm: -0.42, rightArm: 0.42, leftLeg: -0.16, rightLeg: 0.16, handY: -0.9 },
  street: { lean: -0.08, leftArm: -0.08, rightArm: 0.48, leftLeg: -0.03, rightLeg: 0.13, handY: -0.86 },
  victory: { lean: 0.02, leftArm: -2.35, rightArm: 2.35, leftLeg: -0.09, rightLeg: 0.09, handY: -0.72 }
});

const avatarEmoteProfiles = Object.freeze({
  emote_none: { pose: {}, motion: 'idle' },
  emote_wave: {
    pose: { lean: 0.02, leftArm: -0.18, rightArm: 2.28, rightForearm: -0.62, rightLeg: 0.04, rightHandY: -0.7 },
    motion: 'wave',
    accent: 'spark'
  },
  emote_power_flex: {
    pose: { lean: 0, leftArm: -1.65, rightArm: 1.65, leftForearm: -1.1, rightForearm: 1.1, leftLeg: -0.18, rightLeg: 0.18, leftKnee: 0.18, rightKnee: -0.18, handY: -0.64 },
    motion: 'bounce',
    accent: 'burst'
  },
  emote_air_guitar: {
    pose: {
      lean: -0.14,
      leftArm: 0.38,
      rightArm: 0.08,
      leftForearm: -1.35,
      rightForearm: -0.52,
      leftLeg: -0.18,
      rightLeg: 0.12,
      leftKnee: 0.36,
      rightKnee: -0.2,
      leftHandX: 0.04,
      rightHandX: -0.03,
      leftHandY: -0.55,
      rightHandY: -0.58,
      leftHandZ: 0.46,
      rightHandZ: 0.46
    },
    motion: 'strum',
    prop: 'guitar'
  },
  emote_dance_break: {
    pose: { lean: 0.1, leftArm: -0.82, rightArm: 0.92, leftForearm: 0.64, rightForearm: -0.7, leftLeg: -0.2, rightLeg: 0.24, leftKnee: 0.62, rightKnee: -0.62, handY: -0.74 },
    motion: 'dance',
    accent: 'floor'
  },
  emote_high_score: {
    pose: { lean: 0.02, leftArm: -2.12, rightArm: 2.12, leftForearm: -0.28, rightForearm: 0.28, leftLeg: -0.1, rightLeg: 0.1, leftKnee: 0.16, rightKnee: -0.16, handY: -0.68 },
    motion: 'pop',
    accent: 'star'
  },
  emote_thumbs_up: {
    pose: { lean: 0.02, leftArm: -0.12, rightArm: 1.18, rightForearm: 1.15, rightLeg: 0.1, leftKnee: 0.08, rightKnee: -0.08, rightHandY: -0.68 },
    motion: 'thumbs',
    accent: 'thumb'
  }
});

const avatarHeadProfiles = Object.freeze({
  head_spark: { scale: [0.92, 0.96, 0.82], shape: 'round' },
  head_neon_human: { scale: [0.82, 1.08, 0.72], shape: 'oval' },
  head_arcade_star: { scale: [0.92, 0.98, 0.72], shape: 'faceted' },
  head_rebel_cut: { scale: [0.78, 1.02, 0.68], shape: 'angular' },
  head_cyberhawk: { scale: [0.74, 1.18, 0.68], shape: 'tall' }
});

const avatarHelmetProfiles = Object.freeze({
  helmet_vector: { style: 'racer', shell: '#101827', trim: 'secondary' },
  helmet_mohawk_glow: { style: 'mtb', shell: '#111827', trim: 'accent' },
  helmet_mtb_fullface: { style: 'mtb', shell: '#101827', trim: 'primary' },
  helmet_skate_shell: { style: 'skate', shell: '#141a2d', trim: 'primary' },
  helmet_bandana_laser: { style: 'moto', shell: '#141a2d', trim: 'secondary' },
  helmet_moto_fullface: { style: 'fullface', shell: '#0d111d', trim: 'secondary' },
  helmet_viper_hair: { style: 'pilot', shell: '#101827', trim: 'accent' },
  helmet_football_cage: { style: 'football', shell: '#111827', trim: 'primary' },
  helmet_tactical_visor: { style: 'tactical', shell: '#0f1627', trim: 'secondary' },
  helmet_open_face_rider: { style: 'openface', shell: '#161b2a', trim: 'accent' },
  helmet_champion_crown: { style: 'champion', shell: '#111827', trim: 'accent' }
});

function HelmetModel({ helmetId, profile, primary, secondary, accent, visorGlow }) {
  const helmet = avatarHelmetProfiles[helmetId] || avatarHelmetProfiles.helmet_vector;
  const trimColor = helmet.trim === 'primary' ? primary : helmet.trim === 'accent' ? accent : secondary;
  const trimMaterialProps = { color: trimColor, emissive: trimColor, emissiveIntensity: 0.22, roughness: 0.3, metalness: 0.34 };
  const shellMaterialProps = { color: helmet.shell, roughness: 0.28, metalness: 0.42 };
  const visorMaterialProps = {
    color: '#070b14',
    emissive: visorGlow,
    emissiveIntensity: 0.28,
    metalness: 0.42,
    roughness: 0.16,
    transparent: true,
    opacity: 0.92
  };

  return (
    <group position={[0, 1.1, 0]}>
      {helmet.style === 'skate' || helmet.style === 'openface' ? (
        <>
          <mesh position={[0, 0.1, -0.02]} scale={[0.98 * profile.headScale, 0.68 * profile.headScale, 0.84 * profile.headScale]}>
            <sphereGeometry args={[0.36, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          <mesh position={[0, 0.03, 0.25]} scale={[1, 0.34, 1]}>
            <boxGeometry args={[0.58, 0.07, 0.1]} />
            <meshStandardMaterial {...trimMaterialProps} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.28, -0.16, 0.2]} rotation={[0, 0, side * 0.34]}>
                <boxGeometry args={[0.035, 0.44, 0.035]} />
                <meshStandardMaterial color="#050914" roughness={0.46} metalness={0.12} />
              </mesh>
              <mesh position={[side * 0.24, 0.02, 0.02]}>
                <sphereGeometry args={[0.05, 12, 8]} />
                <meshStandardMaterial color={trimColor} emissive={trimColor} emissiveIntensity={0.24} />
              </mesh>
            </group>
          ))}
        </>
      ) : null}

      {helmet.style === 'racer' ? (
        <>
          <mesh scale={[0.88 * profile.headScale, 1.03 * profile.headScale, 0.78 * profile.headScale]}>
            <sphereGeometry args={[0.36, 32, 20]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          <mesh position={[0, 0.07, 0.24]} scale={[1, 0.52, 1]}>
            <boxGeometry args={[0.56, 0.15, 0.1]} />
            <meshStandardMaterial color={visorGlow} emissive={visorGlow} emissiveIntensity={0.38} metalness={0.32} roughness={0.18} transparent opacity={0.82} />
          </mesh>
          <mesh position={[0, 0.25, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.31 * profile.headScale, 0.02, 8, 48]} />
            <meshStandardMaterial {...trimMaterialProps} />
          </mesh>
        </>
      ) : null}

      {helmet.style === 'mtb' ? (
        <>
          <mesh position={[0, 0.05, -0.02]} scale={[0.9 * profile.headScale, 0.98 * profile.headScale, 0.72 * profile.headScale]}>
            <sphereGeometry args={[0.36, 32, 18]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          <mesh position={[0, 0.23, 0.21]} rotation={[-0.18, 0, 0]}>
            <boxGeometry args={[0.64, 0.07, 0.3]} />
            <meshStandardMaterial {...trimMaterialProps} />
          </mesh>
          <mesh position={[0, -0.22, 0.29]}>
            <boxGeometry args={[0.5, 0.13, 0.18]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.27, -0.08, 0.23]} rotation={[0, side * 0.22, side * 0.12]}>
              <boxGeometry args={[0.08, 0.34, 0.14]} />
              <meshStandardMaterial {...trimMaterialProps} />
            </mesh>
          ))}
        </>
      ) : null}

      {helmet.style === 'moto' || helmet.style === 'fullface' || helmet.style === 'tactical' ? (
        <>
          <mesh position={[0, 0.03, -0.03]} scale={[
            helmet.style === 'tactical' ? 0.82 * profile.headScale : 0.9 * profile.headScale,
            helmet.style === 'tactical' ? 0.94 * profile.headScale : 1.04 * profile.headScale,
            helmet.style === 'tactical' ? 0.68 * profile.headScale : 0.82 * profile.headScale
          ]}>
            {helmet.style === 'tactical' ? <boxGeometry args={[0.64, 0.68, 0.52]} /> : <sphereGeometry args={[0.36, 32, 20]} />}
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          <mesh position={[0, 0.04, 0.25]} scale={[1, helmet.style === 'tactical' ? 0.78 : 0.62, 1]}>
            <boxGeometry args={[helmet.style === 'tactical' ? 0.62 : 0.54, helmet.style === 'tactical' ? 0.22 : 0.16, 0.09]} />
            <meshStandardMaterial {...visorMaterialProps} />
          </mesh>
          <mesh position={[0, -0.19, 0.28]}>
            <boxGeometry args={[helmet.style === 'tactical' ? 0.52 : 0.46, 0.22, 0.2]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          {helmet.style === 'fullface' ? (
            <>
              <mesh position={[0, 0.26, 0.18]} rotation={[-0.16, 0, 0]}>
                <boxGeometry args={[0.42, 0.025, 0.16]} />
                <meshStandardMaterial {...trimMaterialProps} />
              </mesh>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 0.29, -0.08, 0.18]} rotation={[0, side * 0.18, 0]}>
                  <boxGeometry args={[0.08, 0.34, 0.16]} />
                  <meshStandardMaterial {...shellMaterialProps} />
                </mesh>
              ))}
            </>
          ) : null}
          {helmet.style === 'tactical' ? [-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.28, -0.1, 0.18]} rotation={[0, side * 0.28, 0]}>
              <boxGeometry args={[0.12, 0.32, 0.14]} />
              <meshStandardMaterial {...trimMaterialProps} />
            </mesh>
          )) : null}
        </>
      ) : null}

      {helmet.style === 'pilot' ? (
        <>
          <mesh position={[0, 0.03, -0.02]} scale={[0.86 * profile.headScale, 1.08 * profile.headScale, 0.74 * profile.headScale]}>
            <sphereGeometry args={[0.36, 32, 20]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          <mesh position={[0, 0.28, -0.03]} scale={[0.44, 0.76, 0.34]}>
            <coneGeometry args={[0.22, 0.5, 5]} />
            <meshStandardMaterial color="#0b0d16" emissive={accent} emissiveIntensity={0.26} roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.03, 0.24]} scale={[1, 0.62, 1]}>
            <boxGeometry args={[0.56, 0.18, 0.09]} />
            <meshStandardMaterial {...visorMaterialProps} />
          </mesh>
        </>
      ) : null}

      {helmet.style === 'football' ? (
        <>
          <mesh position={[0, 0.02, -0.02]} scale={[0.94 * profile.headScale, 0.96 * profile.headScale, 0.78 * profile.headScale]}>
            <sphereGeometry args={[0.36, 32, 20]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.28, -0.02, 0.04]} rotation={[0, side * 0.16, 0]}>
              <boxGeometry args={[0.11, 0.34, 0.16]} />
              <meshStandardMaterial {...shellMaterialProps} />
            </mesh>
          ))}
          <mesh position={[0, 0.08, 0.25]} scale={[1, 0.5, 1]}>
            <boxGeometry args={[0.5, 0.13, 0.08]} />
            <meshStandardMaterial color="#050914" roughness={0.24} metalness={0.36} />
          </mesh>
          {[-0.15, 0, 0.15].map((x) => (
            <mesh key={x} position={[x, -0.11, 0.32]}>
              <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
              <meshStandardMaterial {...trimMaterialProps} />
            </mesh>
          ))}
          {[-0.02, -0.15, -0.27].map((y) => (
            <mesh key={y} position={[0, y, 0.32]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.62, 8]} />
              <meshStandardMaterial {...trimMaterialProps} />
            </mesh>
          ))}
        </>
      ) : null}

      {helmet.style === 'champion' ? (
        <>
          <mesh scale={[0.9 * profile.headScale, 1.02 * profile.headScale, 0.76 * profile.headScale]}>
            <sphereGeometry args={[0.36, 32, 20]} />
            <meshStandardMaterial {...shellMaterialProps} />
          </mesh>
          <mesh position={[0, 0.04, 0.24]} scale={[1, 0.55, 1]}>
            <boxGeometry args={[0.54, 0.16, 0.09]} />
            <meshStandardMaterial {...visorMaterialProps} />
          </mesh>
          {[-0.2, 0, 0.2].map((x) => (
            <mesh key={x} position={[x, 0.36, 0]}>
              <coneGeometry args={[0.075, 0.22, 5]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.55} />
            </mesh>
          ))}
        </>
      ) : null}
    </group>
  );
}

function AvatarModel({ avatar = defaultAvatar, emotePreview = null }) {
  const groupRef = useRef(null);
  const armRefs = useRef({});
  const forearmRefs = useRef({});
  const legRefs = useRef({});
  const lowerLegRefs = useRef({});
  const primary = avatar.primaryColor || defaultAvatar.primaryColor;
  const secondary = avatar.secondaryColor || defaultAvatar.secondaryColor;
  const accent = avatar.accentColor || defaultAvatar.accentColor;
  const profile = avatarBodyProfiles[avatar.bodyId] || avatarBodyProfiles.body_neon_hero;
  const headProfile = avatarHeadProfiles[avatar.headId] || avatarHeadProfiles.head_neon_human;
  const basePose = avatarPoseProfiles[avatar.poseId] || avatarPoseProfiles.idle;
  const activeEmoteId = emotePreview?.id || 'emote_none';
  const activeEmote = avatarEmoteProfiles[activeEmoteId] || avatarEmoteProfiles.emote_none;
  const pose = { ...basePose, ...activeEmote.pose };
  const isAndroid = avatar.bodyType === 'android' || avatar.bodyId === 'body_android_prime';
  const isGuardian = avatar.bodyType === 'guardian' || avatar.bodyId === 'body_guardian_frame';
  const torsoColor = isAndroid ? '#7984a9' : '#111827';
  const suitColor = avatar.outfitId === 'outfit_street_leather' ? '#0b0e17' : '#111a2c';
  const jacketColor = avatar.outfitId === 'outfit_laser_varsity' ? '#f6f8ff' : suitColor;
  const armorColor = avatar.outfitId === 'outfit_sunset_armor' ? '#35144b' : '#101827';
  const skinColor = isAndroid ? '#9aa4c9' : (avatar.headId === 'head_arcade_star' ? '#d9b477' : '#c98b64');
  const visorGlow = ['visor_prism', 'visor_mirrorwrap'].includes(avatar.visorId) ? accent : secondary;
  const trailColor = avatar.trailId === 'trail_fireline' || avatar.trailId === 'trail_comet' ? accent : primary;
  const hairId = avatar.hairId || 'hair_none';
  const hasHelmet = avatar.helmetId && avatar.helmetId !== 'helmet_none';
  const visibleHairId = hasHelmet ? 'hair_none' : hairId;
  const hairColor = hairId === 'hair_glowhawk'
    ? accent
    : hairId === 'hair_viper_sweep'
      ? '#0b0d16'
      : hairId === 'hair_laser_mullet'
        ? '#171019'
        : hairId === 'hair_feathered_mullet'
          ? '#5b3525'
          : hairId === 'hair_midnight_curls'
            ? '#13081f'
            : '#20141b';
  const bootId = avatar.bootsId || defaultAvatar.bootsId;
  const bootColor = bootId === 'boots_chrome_stompers' ? '#c8d5ef' : bootId === 'boots_combat_neon' ? '#080d19' : '#101827';
  const rootTilt = pose.lean;
  const shoulderX = profile.shoulder * 0.78;
  const legX = profile.stance;
  const armRadius = 0.075 * profile.bulk;
  const legRadius = 0.095 * profile.bulk;
  const bootScale = bootId === 'boots_chrome_stompers' ? 1.22 : bootId === 'boots_combat_neon' ? 1.12 : 1;
  const leftForearmBase = pose.leftForearm || 0;
  const rightForearmBase = pose.rightForearm || 0;
  const leftKneeBase = pose.leftKnee || 0;
  const rightKneeBase = pose.rightKnee || 0;

  useFrame((state, delta) => {
    const phase = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (activeEmote.motion === 'dance' ? 0.48 : 0.24);
      groupRef.current.position.y = Math.sin(phase * (activeEmote.motion === 'bounce' ? 4.4 : 1.7)) * (activeEmote.motion === 'bounce' ? 0.07 : 0.035);
    }
    if (armRefs.current[-1]) {
      const danceOffset = activeEmote.motion === 'dance' ? Math.sin(phase * 5.2) * 0.32 : 0;
      const strumOffset = activeEmote.motion === 'strum' ? Math.sin(phase * 7.4) * 0.08 : 0;
      armRefs.current[-1].rotation.z = pose.leftArm - danceOffset - strumOffset;
    }
    if (armRefs.current[1]) {
      const waveOffset = activeEmote.motion === 'wave' ? Math.sin(phase * 7.2) * 0.28 : 0;
      const danceOffset = activeEmote.motion === 'dance' ? Math.cos(phase * 5.2) * 0.34 : 0;
      const strumOffset = activeEmote.motion === 'strum' ? Math.sin(phase * 8.6) * 0.12 : 0;
      armRefs.current[1].rotation.z = pose.rightArm + waveOffset + danceOffset + strumOffset;
    }
    if (forearmRefs.current[-1]) {
      const danceBend = activeEmote.motion === 'dance' ? Math.cos(phase * 5.2) * 0.42 : 0;
      const strumBend = activeEmote.motion === 'strum' ? Math.sin(phase * 8.8) * 0.42 : 0;
      forearmRefs.current[-1].rotation.z = leftForearmBase + danceBend + strumBend;
    }
    if (forearmRefs.current[1]) {
      const waveBend = activeEmote.motion === 'wave' ? Math.sin(phase * 7.2) * 0.46 : 0;
      const thumbsHold = activeEmote.motion === 'thumbs' ? Math.sin(phase * 2.8) * 0.05 : 0;
      const danceBend = activeEmote.motion === 'dance' ? Math.sin(phase * 5.2) * 0.44 : 0;
      const strumBend = activeEmote.motion === 'strum' ? Math.sin(phase * 9.4) * 0.14 : 0;
      forearmRefs.current[1].rotation.z = rightForearmBase + waveBend + thumbsHold + danceBend + strumBend;
    }
    if (legRefs.current[-1]) {
      const danceStep = activeEmote.motion === 'dance' ? Math.sin(phase * 5.2) * 0.22 : 0;
      legRefs.current[-1].rotation.z = pose.leftLeg + danceStep;
    }
    if (legRefs.current[1]) {
      const danceStep = activeEmote.motion === 'dance' ? Math.cos(phase * 5.2) * 0.22 : 0;
      legRefs.current[1].rotation.z = pose.rightLeg - danceStep;
    }
    if (lowerLegRefs.current[-1]) {
      const danceKnee = activeEmote.motion === 'dance' ? Math.abs(Math.sin(phase * 5.2)) * 0.52 : 0;
      lowerLegRefs.current[-1].rotation.z = leftKneeBase + danceKnee;
    }
    if (lowerLegRefs.current[1]) {
      const danceKnee = activeEmote.motion === 'dance' ? Math.abs(Math.cos(phase * 5.2)) * 0.52 : 0;
      lowerLegRefs.current[1].rotation.z = rightKneeBase - danceKnee;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.12, 0]} rotation={[0, 0, rootTilt]}>
      {avatar.auraId !== 'aura_none' ? (
        <group position={[0, 0.3, -0.18]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.12, 0.014, 12, 96]} />
            <meshBasicMaterial color={avatar.auraId === 'aura_sunset_ring' ? accent : secondary} transparent opacity={0.52} />
          </mesh>
          {avatar.auraId === 'aura_outrun_scan' ? [-0.38, -0.12, 0.14, 0.4].map((y) => (
            <mesh key={y} position={[0, y, -0.02]}>
              <boxGeometry args={[1.82, 0.018, 0.012]} />
              <meshBasicMaterial color={primary} transparent opacity={0.35} />
            </mesh>
          )) : null}
          {avatar.auraId === 'aura_electric' ? [0, 0.55, 1.1, 1.65].map((rotation) => (
            <mesh key={rotation} rotation={[Math.PI / 2, 0, rotation]}>
              <torusGeometry args={[0.72, 0.006, 8, 48]} />
              <meshBasicMaterial color={secondary} transparent opacity={0.38} />
            </mesh>
          )) : null}
        </group>
      ) : null}

      {activeEmote.accent === 'floor' ? (
        <group position={[0, -1.48, 0]}>
          {[0.42, 0.62, 0.82].map((radius, index) => (
            <mesh key={radius} rotation={[Math.PI / 2, 0, index * 0.4]}>
              <torusGeometry args={[radius, 0.01, 8, 56]} />
              <meshBasicMaterial color={index % 2 ? secondary : primary} transparent opacity={0.34} />
            </mesh>
          ))}
        </group>
      ) : null}

      {activeEmote.accent === 'star' || activeEmote.accent === 'burst' ? (
        <group position={[0, 1.94, 0.05]}>
          {[0, 0.78].map((rotation) => (
            <mesh key={rotation} rotation={[0, 0, rotation]}>
              <boxGeometry args={[0.1, 0.38, 0.035]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.72} roughness={0.24} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.08, 16, 10]} />
            <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.55} />
          </mesh>
        </group>
      ) : null}

      {activeEmote.accent === 'spark' ? (
        [0.16, 0.28, 0.4].map((offset, index) => (
          <mesh key={offset} position={[0.38 + offset * 0.24, 1.1 + offset, 0.2]} scale={[1 - index * 0.16, 1 - index * 0.16, 1]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.75} />
          </mesh>
        ))
      ) : null}

      {activeEmote.prop === 'guitar' ? (
        <group position={[0.02, 0.12, 0.43]} rotation={[0, 0, -0.36]}>
          <mesh>
            <boxGeometry args={[1.04, 0.1, 0.055]} />
            <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.28} roughness={0.32} metalness={0.28} />
          </mesh>
          <mesh position={[-0.34, -0.02, 0]}>
            <boxGeometry args={[0.34, 0.3, 0.075]} />
            <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.24} roughness={0.34} />
          </mesh>
          <mesh position={[0.58, 0.01, 0]}>
            <boxGeometry args={[0.24, 0.09, 0.06]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} />
          </mesh>
          {[-0.03, 0.03].map((y) => (
            <mesh key={y} position={[0.12, y, 0.035]}>
              <boxGeometry args={[0.92, 0.01, 0.012]} />
              <meshBasicMaterial color="#f6f8ff" transparent opacity={0.72} />
            </mesh>
          ))}
        </group>
      ) : null}

      {avatar.backId !== 'back_none' ? (
        <group position={[0, 0.16, -0.24]}>
          <mesh>
            <boxGeometry args={[profile.shoulder * 1.08, 0.68, 0.08]} />
            <meshStandardMaterial color="#0b1220" emissive={secondary} emissiveIntensity={0.08} roughness={0.42} metalness={0.28} />
          </mesh>
          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.08, 0.05]} rotation={[0, 0, x < 0 ? -0.18 : 0.18]}>
              <boxGeometry args={[0.09, 0.78, 0.05]} />
              <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.16} roughness={0.36} metalness={0.28} />
            </mesh>
          ))}
        </group>
      ) : null}

      {avatar.backId === 'back_arcade_cape' ? (
        <mesh position={[0, -0.04, -0.28]} rotation={[0.16, 0, 0]}>
          <boxGeometry args={[profile.shoulder * 1.55, 1.24, 0.026]} />
          <meshStandardMaterial color="#13081f" emissive={secondary} emissiveIntensity={0.18} roughness={0.62} transparent opacity={0.86} />
        </mesh>
      ) : null}
      {avatar.backId === 'back_boost_pack' ? (
        <group position={[0, 0.2, -0.31]}>
          <mesh>
            <boxGeometry args={[0.42, 0.74, 0.16]} />
            <meshStandardMaterial color="#182235" roughness={0.42} metalness={0.38} />
          </mesh>
          {[-0.13, 0.13].map((x) => (
            <mesh key={x} position={[x, -0.48, -0.03]}>
              <coneGeometry args={[0.075, 0.3, 18]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.3} />
            </mesh>
          ))}
        </group>
      ) : null}
      {avatar.backId === 'back_katana_pair' ? (
        <group position={[0, 0.22, -0.34]}>
          {[-0.7, 0.7].map((angle) => (
            <group key={angle} rotation={[0, 0, angle]}>
              <mesh>
                <cylinderGeometry args={[0.018, 0.018, 1.44, 10]} />
                <meshStandardMaterial color="#d6e7ff" metalness={0.82} roughness={0.22} />
              </mesh>
              <mesh position={[0, -0.82, 0]}>
                <boxGeometry args={[0.14, 0.08, 0.06]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} />
              </mesh>
            </group>
          ))}
        </group>
      ) : null}
      {avatar.backId === 'back_boom_box' ? (
        <group position={[0, 0.08, -0.33]}>
          <mesh>
            <boxGeometry args={[0.76, 0.34, 0.18]} />
            <meshStandardMaterial color="#111827" roughness={0.34} metalness={0.28} />
          </mesh>
          {[-0.24, 0.24].map((x) => (
            <mesh key={x} position={[x, 0, -0.1]}>
              <cylinderGeometry args={[0.1, 0.1, 0.025, 24]} />
              <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.24} />
            </mesh>
          ))}
        </group>
      ) : null}

      <group>
        {profile.torsoStyle === 'runner' ? (
          <mesh position={[0, 0.12, 0]} scale={[1, 1, 0.46]}>
            <capsuleGeometry args={[profile.shoulder * 0.72, profile.torsoHeight * 0.62, 8, 18]} />
            <meshStandardMaterial color={torsoColor} roughness={0.32} metalness={0.18} />
          </mesh>
        ) : null}
        {profile.torsoStyle === 'street' ? (
          <>
            <mesh position={[0, 0.18, 0]} scale={[1, 1, 0.48]}>
              <boxGeometry args={[profile.shoulder * 1.42, profile.torsoHeight * 0.9, 0.54]} />
              <meshStandardMaterial color={torsoColor} roughness={0.34} metalness={0.18} />
            </mesh>
            <mesh position={[0, -0.38, 0]}>
              <boxGeometry args={[profile.waist * 1.42, 0.22, 0.36]} />
              <meshStandardMaterial color="#080d19" roughness={0.4} metalness={0.16} />
            </mesh>
          </>
        ) : null}
        {profile.torsoStyle === 'android' ? (
          <>
            <mesh position={[0, 0.34, 0]}>
              <boxGeometry args={[profile.shoulder * 1.32, 0.44, 0.48]} />
              <meshStandardMaterial color={torsoColor} roughness={0.24} metalness={0.6} />
            </mesh>
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[profile.waist * 1.18, 0.5, 0.38]} />
              <meshStandardMaterial color="#36405f" emissive={secondary} emissiveIntensity={0.14} metalness={0.55} roughness={0.3} />
            </mesh>
          </>
        ) : null}
        {profile.torsoStyle === 'guardian' ? (
          <>
            <mesh position={[0, 0.32, 0]}>
              <boxGeometry args={[profile.shoulder * 1.48, 0.54, 0.54]} />
              <meshStandardMaterial color={torsoColor} roughness={0.3} metalness={0.28} />
            </mesh>
            <mesh position={[0, -0.18, 0]} scale={[1, 1, 0.48]}>
              <cylinderGeometry args={[profile.waist, profile.waist * 0.88, 0.48, 8]} />
              <meshStandardMaterial color="#111a2c" roughness={0.34} metalness={0.24} />
            </mesh>
          </>
        ) : null}
        {profile.torsoStyle === 'hero' || profile.torsoStyle === 'athlete' ? (
          <>
            <mesh position={[0, 0.34, 0]}>
              <boxGeometry args={[profile.shoulder * 1.34, 0.5, 0.46]} />
              <meshStandardMaterial color={torsoColor} roughness={0.32} metalness={0.22} />
            </mesh>
            <mesh position={[0, -0.2, 0]} scale={[1, 1, 0.48]}>
              <cylinderGeometry args={[profile.waist, profile.waist * 0.92, profile.torsoHeight * 0.48, 8]} />
              <meshStandardMaterial color={torsoColor} roughness={0.34} metalness={0.18} />
            </mesh>
          </>
        ) : null}
        <mesh position={[0, 0.46, 0.24]}>
          <boxGeometry args={[profile.shoulder * 1.42, 0.34, 0.07]} />
          <meshStandardMaterial color={jacketColor} emissive={secondary} emissiveIntensity={0.16} roughness={0.36} metalness={0.18} />
        </mesh>
        <mesh position={[0, -0.44, 0]}>
          <boxGeometry args={[profile.waist * 1.62, 0.24, 0.34]} />
          <meshStandardMaterial color="#0d1423" roughness={0.38} metalness={0.18} />
        </mesh>
        {avatar.outfitId === 'outfit_street_leather' || avatar.outfitId === 'outfit_laser_varsity' ? (
          <>
            {[-0.24, 0.24].map((x) => (
              <mesh key={x} position={[x, 0.22, 0.31]} rotation={[0, 0, x < 0 ? -0.2 : 0.2]}>
                <boxGeometry args={[0.18, 0.84, 0.055]} />
                <meshStandardMaterial color={jacketColor} emissive={x < 0 ? primary : secondary} emissiveIntensity={0.2} roughness={0.44} />
              </mesh>
            ))}
          </>
        ) : null}
        {avatar.outfitId === 'outfit_battle_harness' ? (
          <>
            <mesh position={[0, 0.2, 0.34]} rotation={[0, 0, 0.72]}>
              <boxGeometry args={[0.11, 1.08, 0.06]} />
              <meshStandardMaterial color={secondary} roughness={0.36} metalness={0.42} />
            </mesh>
            <mesh position={[0, 0.2, 0.35]} rotation={[0, 0, -0.72]}>
              <boxGeometry args={[0.11, 1.08, 0.06]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} />
            </mesh>
          </>
        ) : null}
        {avatar.outfitId === 'outfit_sunset_armor' || isGuardian ? (
          <>
            <mesh position={[0, 0.48, 0.34]}>
              <boxGeometry args={[profile.shoulder * 1.18, 0.24, 0.08]} />
              <meshStandardMaterial color={armorColor} emissive={accent} emissiveIntensity={0.18} roughness={0.28} metalness={0.44} />
            </mesh>
            {[-0.42, 0.42].map((x) => (
              <mesh key={x} position={[x, 0.18, 0.33]}>
                <boxGeometry args={[0.18, 0.46, 0.08]} />
                <meshStandardMaterial color="#1c2742" emissive={secondary} emissiveIntensity={0.14} metalness={0.36} />
              </mesh>
            ))}
          </>
        ) : null}
        {isAndroid ? (
          <>
            {[-0.18, 0.18].map((x) => (
              <mesh key={x} position={[x, 0.1, 0.35]}>
                <boxGeometry args={[0.08, 0.72, 0.045]} />
                <meshBasicMaterial color={secondary} transparent opacity={0.72} />
              </mesh>
            ))}
          </>
        ) : null}
      </group>

      {[-1, 1].map((side) => {
        const forearmBase = side < 0 ? leftForearmBase : rightForearmBase;
        const handTargetY = (side < 0 ? pose.leftHandY : pose.rightHandY) ?? pose.handY;
        const handY = (handTargetY + 0.49) * profile.armLength;
        const handX = (side < 0 ? pose.leftHandX : pose.rightHandX) ?? 0;
        const handZ = (side < 0 ? pose.leftHandZ : pose.rightHandZ) ?? 0.04;
        return (
          <group
            key={side}
            position={[side * shoulderX, 0.42, 0]}
            ref={(node) => {
              if (node) {
                armRefs.current[side] = node;
              }
            }}
            rotation={[0, 0, side < 0 ? pose.leftArm : pose.rightArm]}
          >
            <mesh position={[0, 0, 0.01]}>
              <sphereGeometry args={[0.14 * profile.bulk, 18, 12]} />
              <meshStandardMaterial color={secondary} roughness={0.32} metalness={0.22} />
            </mesh>
            <mesh position={[0, -0.24 * profile.armLength, 0]}>
              <capsuleGeometry args={[armRadius, 0.38 * profile.armLength, 8, 12]} />
              <meshStandardMaterial color={secondary} roughness={0.34} metalness={0.2} />
            </mesh>
            <group
              position={[0, -0.49 * profile.armLength, 0.02]}
              ref={(node) => {
                if (node) {
                  forearmRefs.current[side] = node;
                }
              }}
              rotation={[0, 0, forearmBase]}
            >
              <mesh>
                <sphereGeometry args={[armRadius * 1.06, 14, 10]} />
                <meshStandardMaterial color={secondary} roughness={0.35} metalness={0.18} />
              </mesh>
              <mesh position={[0, -0.22 * profile.armLength, 0.03]}>
                <capsuleGeometry args={[armRadius * 0.9, 0.34 * profile.armLength, 8, 12]} />
                <meshStandardMaterial color={isAndroid ? '#8b95ba' : '#121b2d'} roughness={0.38} metalness={isAndroid ? 0.5 : 0.18} />
              </mesh>
              <group position={[handX, handY, handZ]}>
                <mesh>
                  <sphereGeometry args={[0.1 * profile.bulk, 18, 12]} />
                  <meshStandardMaterial color={skinColor} roughness={0.3} metalness={0.18} />
                </mesh>
                {activeEmote.motion === 'thumbs' && side > 0 ? (
                  <mesh position={[0.03, 0.12, 0.02]} rotation={[0, 0, -0.38]}>
                    <capsuleGeometry args={[0.032, 0.18, 8, 10]} />
                    <meshStandardMaterial color={skinColor} roughness={0.3} metalness={0.16} />
                  </mesh>
                ) : null}
              </group>
            </group>
            {(avatar.outfitId === 'outfit_sunset_armor' || isGuardian) ? (
              <mesh position={[0, -0.03, 0.03]}>
                <boxGeometry args={[0.26 * profile.bulk, 0.2, 0.18]} />
                <meshStandardMaterial color={armorColor} emissive={secondary} emissiveIntensity={0.14} />
              </mesh>
            ) : null}
          </group>
        );
      })}

      {[-1, 1].map((side) => {
        const kneeBase = side < 0 ? leftKneeBase : rightKneeBase;
        return (
          <group
            key={side}
            position={[side * legX, -0.52, 0]}
            ref={(node) => {
              if (node) {
                legRefs.current[side] = node;
              }
            }}
            rotation={[0, 0, side < 0 ? pose.leftLeg : pose.rightLeg]}
          >
            <mesh position={[0, -0.3 * profile.legLength, 0]}>
              <capsuleGeometry args={[legRadius, 0.48 * profile.legLength, 8, 12]} />
              <meshStandardMaterial color="#101827" roughness={0.42} metalness={0.22} />
            </mesh>
            <group
              position={[0, -0.58 * profile.legLength, 0.02]}
              ref={(node) => {
                if (node) {
                  lowerLegRefs.current[side] = node;
                }
              }}
              rotation={[0, 0, kneeBase]}
            >
              <mesh>
                <sphereGeometry args={[legRadius * 0.9, 14, 10]} />
                <meshStandardMaterial color="#101827" roughness={0.42} metalness={0.2} />
              </mesh>
              <mesh position={[0, -0.28 * profile.legLength, 0.02]}>
                <capsuleGeometry args={[legRadius * 0.86, 0.46 * profile.legLength, 8, 12]} />
                <meshStandardMaterial color={isAndroid ? '#7f8bae' : primary} roughness={0.34} metalness={isAndroid ? 0.48 : 0.22} />
              </mesh>
              <group position={[side * 0.03, -0.62 * profile.legLength, 0.12]}>
                <mesh>
                  <boxGeometry args={[0.24 * profile.bulk * bootScale, 0.14 * bootScale, 0.38 * bootScale]} />
                  <meshStandardMaterial color={bootColor} roughness={0.38} metalness={bootId === 'boots_chrome_stompers' ? 0.72 : 0.28} />
                </mesh>
                {bootId === 'boots_grid_runners' || bootId === 'boots_hover_soles' ? (
                  <mesh position={[0, -0.065, 0.08]}>
                    <boxGeometry args={[0.28 * profile.bulk, 0.024, 0.42]} />
                    <meshBasicMaterial color={bootId === 'boots_hover_soles' ? accent : primary} transparent opacity={0.78} />
                  </mesh>
                ) : null}
                {bootId === 'boots_combat_neon' ? (
                  <mesh position={[0, 0.08, 0.15]}>
                    <boxGeometry args={[0.16 * profile.bulk, 0.035, 0.24]} />
                    <meshBasicMaterial color={secondary} transparent opacity={0.82} />
                  </mesh>
                ) : null}
              </group>
            </group>
          </group>
        );
      })}

      <mesh position={[0, 0.6, 0]} scale={[1, 1, 0.72]}>
        <cylinderGeometry args={[0.22 * profile.headScale, 0.28 * profile.headScale, 0.16, 16]} />
        <meshStandardMaterial color={jacketColor} emissive={secondary} emissiveIntensity={0.1} roughness={0.34} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.77, 0]}>
        <cylinderGeometry args={[0.12 * profile.headScale, 0.1 * profile.headScale, 0.34, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.32} metalness={0.18} />
      </mesh>
      <group position={[0, 1.08, 0]} scale={headProfile.scale.map((value) => value * profile.headScale)}>
        {headProfile.shape === 'faceted' ? (
          <mesh>
            <dodecahedronGeometry args={[0.33, 0]} />
            <meshStandardMaterial color={skinColor} roughness={0.2} metalness={0.34} />
          </mesh>
        ) : null}
        {headProfile.shape === 'angular' ? (
          <mesh>
            <boxGeometry args={[0.48, 0.58, 0.4]} />
            <meshStandardMaterial color={skinColor} roughness={0.25} metalness={0.16} />
          </mesh>
        ) : null}
        {headProfile.shape === 'round' || headProfile.shape === 'oval' || headProfile.shape === 'tall' ? (
          <mesh>
            <sphereGeometry args={[0.31, 32, 22]} />
            <meshStandardMaterial color={skinColor} roughness={0.22} metalness={0.18} />
          </mesh>
        ) : null}
      </group>
      <mesh position={[0, 1.06, 0.25]}>
        <boxGeometry args={[avatar.headId === 'head_rebel_cut' ? 0.13 : 0.1, 0.08, 0.12]} />
        <meshStandardMaterial color={skinColor} roughness={0.28} />
      </mesh>

      {!hasHelmet && visibleHairId === 'hair_glowhawk' ? [-0.16, 0, 0.16].map((z) => (
        <mesh key={z} position={[0, 1.36, z]}>
          <boxGeometry args={[0.07, 0.44, 0.09]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
        </mesh>
      )) : null}
      {!hasHelmet && visibleHairId === 'hair_short_crop' ? (
        <mesh position={[0, 1.23, -0.02]} scale={[0.9, 0.38, 0.72]}>
          <sphereGeometry args={[0.3, 20, 12]} />
          <meshStandardMaterial color={hairColor} roughness={0.52} metalness={0.06} />
        </mesh>
      ) : null}
      {!hasHelmet && visibleHairId === 'hair_side_part' ? (
        <>
          <mesh position={[-0.06, 1.28, -0.02]} scale={[1, 0.48, 0.74]}>
            <sphereGeometry args={[0.3, 20, 12]} />
            <meshStandardMaterial color={hairColor} roughness={0.5} metalness={0.08} />
          </mesh>
          <mesh position={[0.16, 1.26, 0.12]} rotation={[0, 0, -0.38]}>
            <boxGeometry args={[0.16, 0.34, 0.08]} />
            <meshStandardMaterial color={hairColor} emissive={accent} emissiveIntensity={0.1} roughness={0.46} />
          </mesh>
        </>
      ) : null}
      {!hasHelmet && visibleHairId === 'hair_viper_sweep' ? (
        <mesh position={[0, 1.38, -0.02]} scale={[0.78, 1.1, 0.48]}>
          <coneGeometry args={[0.26, 0.56, 5]} />
          <meshStandardMaterial color={hairColor} emissive={accent} emissiveIntensity={0.24} roughness={0.5} />
        </mesh>
      ) : null}
      {!hasHelmet && ['hair_laser_mullet', 'hair_classic_mullet', 'hair_feathered_mullet'].includes(visibleHairId) ? (
        <>
          <mesh position={[0, 1.28, -0.03]} scale={[1, 0.42, 0.68]}>
            <sphereGeometry args={[0.29, 20, 14]} />
            <meshStandardMaterial color={hairColor} emissive={visibleHairId === 'hair_laser_mullet' ? secondary : '#000000'} emissiveIntensity={visibleHairId === 'hair_laser_mullet' ? 0.18 : 0} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.16, -0.18]} scale={[0.9, 0.72, 0.5]}>
            <sphereGeometry args={[0.25, 20, 12]} />
            <meshStandardMaterial color={hairColor} roughness={0.5} />
          </mesh>
          {[-0.22, 0.22].map((x) => (
            <mesh key={x} position={[x, 1.04, -0.12]} rotation={[0, 0, x < 0 ? -0.1 : 0.1]}>
              <capsuleGeometry args={[0.06, visibleHairId === 'hair_feathered_mullet' ? 0.38 : 0.28, 8, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.52} />
            </mesh>
          ))}
          {[0, 1, 2].map((row) => (
            <mesh key={row} position={[0, 0.98 - row * 0.1, -0.21 - row * 0.008]} scale={[0.9 - row * 0.12, 0.9, 0.32]}>
              <capsuleGeometry args={[0.12, visibleHairId === 'hair_feathered_mullet' ? 0.32 : 0.24, 8, 12]} />
              <meshStandardMaterial color={hairColor} emissive={visibleHairId === 'hair_laser_mullet' ? secondary : '#000000'} emissiveIntensity={visibleHairId === 'hair_laser_mullet' ? 0.08 : 0} roughness={0.54} />
            </mesh>
          ))}
          <mesh position={[0, 0.78, -0.16]} scale={[0.62, 0.72, 0.26]}>
            <capsuleGeometry args={[0.1, visibleHairId === 'hair_feathered_mullet' ? 0.28 : 0.18, 8, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.54} />
          </mesh>
          {visibleHairId === 'hair_laser_mullet' ? (
            <>
              <mesh position={[-0.11, 1.32, 0.22]} rotation={[0, 0, -0.18]}>
                <boxGeometry args={[0.1, 0.42, 0.05]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.44} />
              </mesh>
              <mesh position={[0.12, 0.92, -0.24]} rotation={[0, 0, 0.12]}>
                <boxGeometry args={[0.08, 0.28, 0.045]} />
                <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.36} />
              </mesh>
            </>
          ) : null}
          {visibleHairId === 'hair_feathered_mullet' ? (
            [-0.18, 0, 0.18].map((x) => (
              <mesh key={x} position={[x, 0.9, -0.24]} rotation={[0.12, 0, x * 0.36]}>
                <boxGeometry args={[0.12, 0.28, 0.045]} />
                <meshStandardMaterial color={hairColor} roughness={0.58} />
              </mesh>
            ))
          ) : null}
        </>
      ) : null}
      {!hasHelmet && visibleHairId === 'hair_midnight_curls' ? [-0.24, -0.12, 0, 0.12, 0.24].map((x, index) => (
        <mesh key={x} position={[x, 1.29 + (index % 2) * 0.04, 0.04]}>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color={hairColor} emissive={accent} emissiveIntensity={0.18} roughness={0.55} />
        </mesh>
      )) : null}

      {hasHelmet ? (
        <HelmetModel
          accent={accent}
          helmetId={avatar.helmetId}
          primary={primary}
          profile={profile}
          secondary={secondary}
          visorGlow={visorGlow}
        />
      ) : null}

      {!hasHelmet && avatar.visorId === 'visor_terminus' ? (
        [-0.11, 0.11].map((x) => (
          <mesh key={x} position={[x, 1.12, 0.31]}>
            <boxGeometry args={[0.12, 0.055, 0.045]} />
            <meshStandardMaterial color="#ff4545" emissive="#ff4545" emissiveIntensity={0.95} />
          </mesh>
        ))
      ) : !hasHelmet ? (
        <group position={[0, 1.12, 0.31]}>
          <mesh>
            <boxGeometry args={[avatar.visorId === 'visor_mirrorwrap' ? 0.58 : 0.48, avatar.visorId === 'visor_shutter' ? 0.15 : 0.1, 0.055]} />
            <meshStandardMaterial color={avatar.visorId === 'visor_clear' ? '#d7fbff' : visorGlow} emissive={visorGlow} emissiveIntensity={0.44} transparent opacity={avatar.visorId === 'visor_clear' ? 0.72 : 0.86} metalness={0.36} roughness={0.18} />
          </mesh>
          {avatar.visorId === 'visor_shutter' ? [-0.045, 0, 0.045].map((y) => (
            <mesh key={y} position={[0, y, 0.035]}>
              <boxGeometry args={[0.5, 0.015, 0.02]} />
              <meshBasicMaterial color="#070b14" />
            </mesh>
          )) : null}
        </group>
      ) : null}

      {avatar.trailId !== 'trail_none' ? (
        <group position={[0, -1.48, -0.12]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[avatar.trailId === 'trail_comet' ? 0.64 : 0.5, 0.018, 10, 70]} />
            <meshBasicMaterial color={trailColor} transparent opacity={0.58} />
          </mesh>
          {avatar.trailId === 'trail_laser_grid' ? [-0.34, 0, 0.34].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.018, 0.018, 0.72]} />
              <meshBasicMaterial color={secondary} transparent opacity={0.52} />
            </mesh>
          )) : null}
        </group>
      ) : null}
    </group>
  );
}

function AvatarPreview3D({ avatar, emotePreview }) {
  const frameClass = `frame-${(avatar.frameId || defaultAvatar.frameId).replaceAll('_', '-')}`;
  return (
    <div className={`avatar-canvas ${frameClass}`} style={{ '--primary': avatar.primaryColor, '--secondary': avatar.secondaryColor, '--accent': avatar.accentColor || defaultAvatar.accentColor }}>
      <Canvas camera={{ position: [0, 0.45, 4.55], fov: 41 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={['#08101e']} />
        <ambientLight intensity={0.8} />
        <directionalLight color="#ffffff" intensity={2.4} position={[3, 5, 4]} />
        <pointLight color={avatar.secondaryColor} intensity={3.2} position={[-2, 1.5, 2]} />
        <Suspense fallback={null}>
          <AvatarModel avatar={avatar} emotePreview={emotePreview} />
          <ContactShadows blur={2.8} far={4} opacity={0.32} position={[0, -1.82, 0]} scale={4} />
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
  const [activeAvatarSlot, setActiveAvatarSlot] = useState('body');
  const [emotePreview, setEmotePreview] = useState(null);
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
      if (slot === 'emote') {
        setEmotePreview({ id: cosmeticId, key: Date.now() });
      }
      await Promise.all([profile.refresh(), inventory.refresh()]);
    } finally {
      setEquipState('');
    }
  }

  function triggerEmote(cosmeticId = avatar.emoteId || defaultAvatar.emoteId) {
    setEmotePreview({ id: cosmeticId, key: Date.now() });
  }

  async function randomizeAvatar() {
    setEquipState('randomize');
    setSaveState('Randomizing');
    const [primaryColor, secondaryColor, accentColor] = randomFrom(avatarColorways);
    const chosenBySlot = {};
    for (const slot of AVATAR_EQUIPMENT_SLOTS) {
      const ownedItems = (catalogBySlot[slot] || []).filter((item) => ownedIds.has(item.cosmeticId));
      if (ownedItems.length) {
        chosenBySlot[slot] = randomFrom(ownedItems);
      }
    }

    const nextAvatar = {
      ...avatar,
      primaryColor,
      secondaryColor,
      accentColor
    };
    for (const [slot, item] of Object.entries(chosenBySlot)) {
      const field = avatarFieldBySlot[slot];
      if (field) {
        nextAvatar[field] = avatarValueForSlot(slot, item.cosmeticId);
      }
      if (slot === 'body') {
        nextAvatar.bodyType = bodyTypeByCosmeticId[item.cosmeticId] || nextAvatar.bodyType;
      }
    }

    try {
      setAvatar(nextAvatar);
      for (const [slot, item] of Object.entries(chosenBySlot)) {
        if (equipped[slot] !== item.cosmeticId) {
          await api.equipCosmetic(slot, item.cosmeticId);
        }
      }
      const result = await api.updateAvatar(nextAvatar);
      setAvatar(result.player.avatar);
      await Promise.all([profile.refresh(), inventory.refresh()]);
      setSaveState('Randomized');
    } catch (error) {
      setSaveState(error.message);
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
  const activeSlotItems = catalogBySlot[activeAvatarSlot] || [];
  const activeSlotLabel = avatarSlotLabels[activeAvatarSlot] || activeAvatarSlot;
  const activePreviewEmote = emotePreview || (activeAvatarSlot === 'emote' ? { id: avatar.emoteId || defaultAvatar.emoteId } : null);
  return (
    <Shell>
      <section className="profile-grid">
        <div className="panel wide builder-panel">
          <div className="avatar-preview-column">
            <div className="panel-header">
              <h2><Box size={22} /> Avatar builder</h2>
              <span className="builder-tag">{avatar.bodyType || 'hero'} base</span>
            </div>
            <AvatarPreview3D avatar={avatar} emotePreview={activePreviewEmote} />
          </div>
          <div className="builder-controls">
            <div className="customizer-header">
              <h3><Palette size={18} /> Customize</h3>
              <button className="icon-button" disabled={equipState === 'randomize'} onClick={randomizeAvatar} title="Randomize avatar" type="button"><RefreshCcw size={18} /></button>
            </div>
            <div className="avatar-editor">
              <label>Primary <input type="color" value={avatar.primaryColor} onChange={(event) => updateAvatarDraft({ primaryColor: event.target.value })} /></label>
              <label>Secondary <input type="color" value={avatar.secondaryColor} onChange={(event) => updateAvatarDraft({ secondaryColor: event.target.value })} /></label>
              <label>Accent <input type="color" value={avatar.accentColor || defaultAvatar.accentColor} onChange={(event) => updateAvatarDraft({ accentColor: event.target.value })} /></label>
              <label>Avatar name <input maxLength="40" value={avatar.avatarId} onChange={(event) => updateAvatarDraft({ avatarId: event.target.value })} /></label>
            </div>
            <div className="slot-tabs" role="tablist" aria-label="Avatar customization slots">
              {AVATAR_EQUIPMENT_SLOTS.map((slot) => (
                <button
                  aria-selected={activeAvatarSlot === slot}
                  className={activeAvatarSlot === slot ? 'slot-tab active' : 'slot-tab'}
                  key={slot}
                  onClick={() => setActiveAvatarSlot(slot)}
                  role="tab"
                  type="button"
                >
                  {avatarSlotLabels[slot] || slot}
                </button>
              ))}
            </div>
            <section className="inline-slot-panel">
              <div className="customizer-header">
                <h3><Sparkles size={18} /> {activeSlotLabel}</h3>
                {activeAvatarSlot === 'emote' ? (
                  <button className="icon-button" onClick={() => triggerEmote()} title="Play selected emote" type="button">
                    <Sparkles size={18} />
                  </button>
                ) : (
                  <span>{activeSlotItems.length} options</span>
                )}
              </div>
              <div className="inline-catalog">
                {activeSlotItems.length ? activeSlotItems.map((item) => (
                  <CatalogItemButton
                    busy={equipState === 'randomize' || equipState === `${activeAvatarSlot}:${item.cosmeticId}`}
                    equippedId={equipped[activeAvatarSlot]}
                    item={item}
                    key={item.cosmeticId}
                    onEquip={equipCosmetic}
                    owned={ownedIds.has(item.cosmeticId)}
                  />
                )) : (
                  <p className="muted-copy">Catalog is loading for this slot.</p>
                )}
              </div>
            </section>
            <button className="primary-button" onClick={saveAvatar} type="button">
              <Save size={18} />
              {saveState || 'Save avatar'}
            </button>
          </div>
        </div>
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
