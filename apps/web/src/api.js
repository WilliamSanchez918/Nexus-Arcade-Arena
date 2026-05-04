const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';
const PLAYER_TOKEN_KEY = 'nexus.playerToken';

export function getPlayerToken() {
  return window.localStorage.getItem(PLAYER_TOKEN_KEY);
}

export function setPlayerToken(token) {
  if (token) {
    window.localStorage.setItem(PLAYER_TOKEN_KEY, token);
  }
}

async function request(path, options = {}) {
  const headers = {
    'content-type': 'application/json',
    ...options.headers
  };
  const playerToken = getPlayerToken();
  if (playerToken) {
    headers['x-player-id'] = playerToken;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }
  return body;
}

export const api = {
  devLogin(payload) {
    return request('/api/player/dev-login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  claimCabinetSession(payload) {
    return request('/api/player/claim-cabinet-session', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getLoginStatus(sessionId) {
    return request(`/api/arcade/cabinet-login/${sessionId}/status`);
  },
  getProfile() {
    return request('/api/player/me');
  },
  updateAvatar(avatar) {
    return request('/api/player/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar })
    });
  },
  getStats() {
    return request('/api/player/me/stats');
  },
  getLeaderboards(gameId = 'rush_run') {
    return request(`/api/leaderboards/${gameId}?scope=global&limit=10`);
  },
  getOperatorCabinets() {
    return request('/api/operator/cabinets');
  },
  logoutPlayer(cabinetId, slot) {
    return request(`/api/arcade/cabinet/${cabinetId}/logout-player`, {
      method: 'POST',
      body: JSON.stringify({ slot })
    });
  },
  getPassportEvents() {
    return request('/api/operator/passport-events?limit=20');
  },
  getAuthClients() {
    return request('/api/auth/clients');
  },
  registerAuthClient(payload) {
    return request('/api/auth/clients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
