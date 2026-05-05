const targets = [
  ['API health', process.env.PREVIEW_API_URL || 'http://127.0.0.1:3100/healthz'],
  ['Web app', process.env.PREVIEW_WEB_URL || 'http://127.0.0.1:5173/']
];

if (process.env.PREVIEW_LEGACY_GAME_URL) {
  targets.push(['Legacy browser fallback', process.env.PREVIEW_LEGACY_GAME_URL]);
}

let failed = false;

for (const [label, url] of targets) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    console.log(`ok ${label}: ${url}`);
  } catch (error) {
    failed = true;
    console.error(`fail ${label}: ${url} - ${error.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
}
