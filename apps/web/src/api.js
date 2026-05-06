import { createClient } from '@supabase/supabase-js';
import {
  hasSupabaseClientConfig,
  supabaseClientKeyFromEnv
} from './supabaseConfig.js';

function runtimeApiBaseUrl() {
  const fromQuery = new URLSearchParams(window.location.search).get('apiBaseUrl');
  return fromQuery || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';
}

export const API_BASE_URL = runtimeApiBaseUrl();
const PLAYER_TOKEN_KEY = 'nexus.playerToken';
const MANAGED_AUTH_TOKEN_KEY = 'nexus.managedAuthToken';
const OPERATOR_TOKEN_KEY = 'nexus.operatorToken';
let supabaseClient;

function runtimeEnv() {
  return import.meta.env || {};
}

export function getPlayerToken() {
  return window.localStorage.getItem(PLAYER_TOKEN_KEY);
}

export function setPlayerToken(token) {
  if (token) {
    window.localStorage.setItem(PLAYER_TOKEN_KEY, token);
  }
}

export function clearPlayerToken() {
  window.localStorage.removeItem(PLAYER_TOKEN_KEY);
  window.localStorage.removeItem(MANAGED_AUTH_TOKEN_KEY);
}

export function getManagedAuthToken() {
  return window.localStorage.getItem(MANAGED_AUTH_TOKEN_KEY);
}

export function setManagedAuthToken(token) {
  if (token) {
    window.localStorage.setItem(MANAGED_AUTH_TOKEN_KEY, token);
  }
}

export function isManagedAuthEnabled() {
  return hasSupabaseClientConfig(runtimeEnv());
}

export function getSupabaseClient() {
  if (!isManagedAuthEnabled()) {
    return null;
  }
  if (!supabaseClient) {
    const env = runtimeEnv();
    supabaseClient = createClient(
      env.VITE_SUPABASE_URL,
      supabaseClientKeyFromEnv(env)
    );
  }
  return supabaseClient;
}

export function getOperatorToken() {
  return window.localStorage.getItem(OPERATOR_TOKEN_KEY);
}

export function setOperatorToken(token) {
  if (token) {
    window.localStorage.setItem(OPERATOR_TOKEN_KEY, token);
  }
}

export function clearOperatorToken() {
  window.localStorage.removeItem(OPERATOR_TOKEN_KEY);
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
  const managedAuthToken = getManagedAuthToken();
  if (managedAuthToken) {
    headers.authorization = `Bearer ${managedAuthToken}`;
  }
  const operatorToken = getOperatorToken();
  if (operatorToken) {
    headers['x-operator-token'] = operatorToken;
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
  verifyPlayerTwoFactor(payload) {
    return request('/api/player/dev-login/verify-2fa', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  createManagedPlayerSession(payload) {
    return request('/api/player/auth/session', {
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
  getAvatarCatalog() {
    return request('/api/player/avatar/catalog');
  },
  getInventory() {
    return request('/api/player/me/inventory');
  },
  updateAvatar(avatar) {
    return request('/api/player/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar })
    });
  },
  equipCosmetic(slot, cosmeticId) {
    return request('/api/player/me/equipment', {
      method: 'PATCH',
      body: JSON.stringify({ slot, cosmeticId })
    });
  },
  getStats() {
    return request('/api/player/me/stats');
  },
  getLeaderboards(gameId = 'nexus_relay') {
    return request(`/api/leaderboards/${gameId}?scope=global&limit=10`);
  },
  getOperatorCabinets() {
    return request('/api/operator/cabinets');
  },
  getOperatorConfig() {
    return request('/api/operator/config');
  },
  updateOperatorConfig(payload) {
    return request('/api/operator/config', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },
  operatorLogin(payload) {
    return request('/api/operator/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  verifyOperatorTwoFactor(payload) {
    return request('/api/operator/verify-2fa', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
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
  },
  getOAuthAuthorizeSummary(searchParams) {
    const query = searchParams instanceof URLSearchParams ? searchParams.toString() : String(searchParams || '');
    return request(`/oauth/authorize/summary${query ? `?${query}` : ''}`);
  },
  buildOAuthAuthorizeUrl(searchParams) {
    const params = searchParams instanceof URLSearchParams
      ? new URLSearchParams(searchParams)
      : new URLSearchParams(String(searchParams || ''));
    const playerToken = getPlayerToken();
    if (playerToken) {
      params.set('player_token', playerToken);
    }
    return `${API_BASE_URL}/oauth/authorize?${params.toString()}`;
  }
};
