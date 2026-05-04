export class HubApiClient {
  constructor({ apiBaseUrl }) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...options.headers
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `API request failed with ${response.status}`);
    }
    return body;
  }

  createLoginSession(payload) {
    return this.request('/api/arcade/cabinet-login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  getActivePlayers(cabinetId) {
    return this.request(`/api/arcade/cabinet/${cabinetId}/active-players`);
  }

  logoutPlayer(cabinetId, slot) {
    return this.request(`/api/arcade/cabinet/${cabinetId}/logout-player`, {
      method: 'POST',
      body: JSON.stringify({ slot })
    });
  }

  startGameSession(payload) {
    return this.request('/api/arcade/game-session/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  endGameSession(payload) {
    return this.request('/api/arcade/game-session/end', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  heartbeat(cabinetId, payload) {
    return this.request(`/api/arcade/cabinet/${cabinetId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}
