import {
  AvatarRuntimeManifestSchema,
  exportAvatarRuntimeManifest
} from '../../../packages/shared/src/index.js';

export function runtimeAvatarForPlayer(player = {}, { target = '2d' } = {}) {
  const runtime = player.avatarRuntime
    ? AvatarRuntimeManifestSchema.parse(player.avatarRuntime)
    : exportAvatarRuntimeManifest(player.avatar, { target });

  return AvatarRuntimeManifestSchema.parse({
    ...runtime,
    target
  });
}

export function runnerVisualProfile(runtimeAvatar) {
  const bodyType = runtimeAvatar.morphology.bodyType;
  const equipment = runtimeAvatar.equipment;
  return {
    bodyScale: bodyType === 'guardian' ? 1.14 : bodyType === 'runner' ? 0.92 : bodyType === 'street' ? 0.98 : 1,
    headScale: bodyType === 'android' ? 0.9 : bodyType === 'runner' ? 0.92 : 1,
    hasHelmet: Boolean(equipment.helmet && equipment.helmet !== 'helmet_none'),
    hasBack: Boolean(equipment.back && equipment.back !== 'back_none'),
    bootScale: equipment.boots === 'boots_chrome_stompers' ? 1.18 : equipment.boots === 'boots_hover_soles' ? 1.12 : 1,
    trailStyle: equipment.trail || 'trail_neon',
    auraStyle: equipment.aura || 'aura_none',
    emoteId: runtimeAvatar.animation.emoteId
  };
}

export function avatarTelemetry(runtimeAvatar) {
  return {
    manifestVersion: runtimeAvatar.manifestVersion,
    target: runtimeAvatar.target,
    avatarId: runtimeAvatar.avatarId,
    bodyType: runtimeAvatar.morphology.bodyType,
    equipment: runtimeAvatar.equipment,
    animation: runtimeAvatar.animation
  };
}
