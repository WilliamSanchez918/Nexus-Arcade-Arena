import { PlayerPassportIntegrationEventSchema } from '../../../../packages/shared/src/index.js';

const recentEvents = [];

export function publishIntegrationEvent(io, eventInput) {
  const event = PlayerPassportIntegrationEventSchema.parse({
    occurredAt: new Date().toISOString(),
    ...eventInput
  });

  recentEvents.push(event);
  if (recentEvents.length > 500) {
    recentEvents.shift();
  }

  io?.emit?.('player.passport.integration.event', event);
  return event;
}

export function listRecentIntegrationEvents(limit = 100) {
  return recentEvents.slice(-limit).reverse();
}
