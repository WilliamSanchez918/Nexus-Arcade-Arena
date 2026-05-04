import QRCode from 'qrcode';
import {
  CabinetLoginSession,
  Cabinet,
  PlayerProfile
} from '../models/index.js';
import { config } from '../config.js';
import { generatePairingCode, hashToken, randomToken, safeEqualHash } from './tokenService.js';
import { toPublicPlayer } from './passportService.js';
import { publishIntegrationEvent } from './integrationEventService.js';

function buildQrUrl({ sessionId, token, appBaseUrl = config.appBaseUrl }) {
  const url = new URL(`/play/login/${sessionId}`, appBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

function chooseAvailableSlot(cabinet, desiredSlot = 'auto') {
  const occupied = new Set((cabinet?.activePlayers || []).map((player) => player.slot));
  if (desiredSlot !== 'auto') {
    return desiredSlot;
  }
  return occupied.has('P1') ? 'P2' : 'P1';
}

export async function createCabinetLoginSession({ cabinetId, siteId, desiredSlot = 'auto' }) {
  const token = randomToken();
  const pairingCode = generatePairingCode();
  const expiresAt = new Date(Date.now() + config.qrTokenTtlSeconds * 1000);

  const session = await CabinetLoginSession.create({
    cabinetId,
    siteId,
    desiredSlot,
    pairingCode,
    qrTokenHash: hashToken(token),
    expiresAt
  });

  await Cabinet.updateOne(
    { cabinetId },
    { $setOnInsert: { cabinetId }, $set: { siteId } },
    { upsert: true }
  );

  const qrUrl = buildQrUrl({ sessionId: session._id, token });
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 512 });

  return {
    session,
    response: {
      sessionId: String(session._id),
      cabinetId,
      siteId,
      status: session.status,
      desiredSlot,
      expiresAt: expiresAt.toISOString(),
      pairingCode,
      qrUrl,
      qrDataUrl
    }
  };
}

export async function getCabinetLoginStatus(sessionId) {
  const session = await CabinetLoginSession.findById(sessionId).populate('playerId');
  if (!session) {
    const error = new Error('Cabinet login session not found');
    error.statusCode = 404;
    throw error;
  }

  if (session.status === 'pending' && session.expiresAt <= new Date()) {
    session.status = 'expired';
    await session.save();
  }

  return {
    sessionId: String(session._id),
    cabinetId: session.cabinetId,
    siteId: session.siteId,
    status: session.status,
    desiredSlot: session.desiredSlot,
    playerSlot: session.playerSlot,
    expiresAt: session.expiresAt.toISOString(),
    pairingCode: session.pairingCode,
    player: session.playerId ? toPublicPlayer(session.playerId) : undefined
  };
}

export async function claimCabinetLoginSession({ sessionId, token, playerId, desiredSlot }, io) {
  const session = await CabinetLoginSession.findById(sessionId);
  if (!session) {
    const error = new Error('Cabinet login session not found');
    error.statusCode = 404;
    throw error;
  }
  if (session.status !== 'pending') {
    const error = new Error(`Cabinet login session is ${session.status}`);
    error.statusCode = 409;
    throw error;
  }
  if (session.expiresAt <= new Date()) {
    session.status = 'expired';
    await session.save();
    const error = new Error('Cabinet login session expired');
    error.statusCode = 410;
    throw error;
  }
  if (!safeEqualHash(hashToken(token), session.qrTokenHash)) {
    const error = new Error('Invalid pairing token');
    error.statusCode = 401;
    throw error;
  }

  const profile = await PlayerProfile.findById(playerId);
  if (!profile || profile.status !== 'active') {
    const error = new Error('Player profile not found');
    error.statusCode = 404;
    throw error;
  }

  const cabinet = await Cabinet.findOneAndUpdate(
    { cabinetId: session.cabinetId },
    { $setOnInsert: { cabinetId: session.cabinetId, siteId: session.siteId } },
    { upsert: true, new: true }
  );
  const slot = chooseAvailableSlot(cabinet, desiredSlot || session.desiredSlot);
  const publicPlayer = toPublicPlayer(profile);
  const activePlayer = {
    slot,
    playerId: profile._id,
    displayName: publicPlayer.displayName,
    avatar: publicPlayer.avatar,
    level: publicPlayer.level,
    sessionId: session._id,
    claimedAt: new Date(),
    lastSeenAt: new Date()
  };

  const activePlayers = (cabinet.activePlayers || []).filter((player) => (
    player.slot !== slot && String(player.playerId) !== String(profile._id)
  ));
  activePlayers.push(activePlayer);
  cabinet.activePlayers = activePlayers;
  cabinet.status = 'online';
  await cabinet.save();

  session.status = 'claimed';
  session.playerId = profile._id;
  session.playerSlot = slot;
  session.claimedAt = new Date();
  await session.save();

  const claimedPayload = {
    sessionId: String(session._id),
    cabinetId: session.cabinetId,
    siteId: session.siteId,
    playerSlot: slot,
    player: { ...publicPlayer, playerId: String(profile._id) }
  };

  io?.to?.(`cabinet:${session.cabinetId}`)?.emit('cabinet.login.claimed', claimedPayload);
  publishIntegrationEvent(io, {
    type: 'player.session.claimed',
    playerId: String(profile._id),
    cabinetId: session.cabinetId,
    payload: claimedPayload
  });

  return claimedPayload;
}

export async function getActivePlayers(cabinetId) {
  const cabinet = await Cabinet.findOne({ cabinetId });
  return {
    cabinetId,
    siteId: cabinet?.siteId,
    activePlayers: (cabinet?.activePlayers || []).map((player) => ({
      slot: player.slot,
      playerId: String(player.playerId),
      displayName: player.displayName,
      avatar: player.avatar,
      level: player.level,
      claimedAt: player.claimedAt?.toISOString()
    }))
  };
}

export async function logoutCabinetPlayer({ cabinetId, slot }, io) {
  const cabinet = await Cabinet.findOne({ cabinetId });
  if (!cabinet) {
    return { cabinetId, activePlayers: [] };
  }

  cabinet.activePlayers = (cabinet.activePlayers || []).filter((player) => player.slot !== slot);
  await cabinet.save();
  const payload = await getActivePlayers(cabinetId);
  io?.to?.(`cabinet:${cabinetId}`)?.emit('cabinet.player.logout', { cabinetId, slot });
  return payload;
}
