const fs = require('fs');
const path = require('path');

const AUTH_URL = 'https://authz.constantcontact.com/oauth2/default/v1/authorize';
const TOKEN_URL = 'https://authz.constantcontact.com/oauth2/default/v1/token';
const API_BASE = 'https://api.cc.email/v3';
const SCOPES = 'campaign_data contact_data account_read offline_access';
const TOKEN_FILE = path.join(__dirname, '.constantcontact-tokens.json');

function creds() {
  const id = process.env.CONSTANT_CONTACT_CLIENT_ID, secret = process.env.CONSTANT_CONTACT_CLIENT_SECRET;
  if (!id || !secret) {
    const err = new Error('CONSTANT_CONTACT_CLIENT_ID / CONSTANT_CONTACT_CLIENT_SECRET are not set on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
  return { id, secret };
}
function redirectUri() {
  return process.env.CONSTANT_CONTACT_REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/auth/constantcontact/callback`;
}
function basicAuthHeader() {
  const { id, secret } = creds();
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

function readTokens() {
  try { return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')); } catch (e) { return null; }
}
function writeTokens(t) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2), { mode: 0o600 });
}

function getAuthUrl(state) {
  const { id } = creds();
  const p = new URLSearchParams({ client_id: id, redirect_uri: redirectUri(), response_type: 'code', scope: SCOPES, state });
  return `${AUTH_URL}?${p}`;
}

async function tokenError(res, prefix) {
  const text = await res.text().catch(() => '');
  const err = new Error(`${prefix} (HTTP ${res.status}): ${text.slice(0, 300)}`);
  err.status = res.status;
  return err;
}

// The auth code is only valid for 5 minutes, so this has to be called right
// after the redirect back from Constant Contact's consent screen.
async function exchangeCode(code) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: basicAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() }),
  });
  if (!res.ok) throw await tokenError(res, 'Constant Contact token exchange failed');
  const body = await res.json();
  writeTokens({ access_token: body.access_token, refresh_token: body.refresh_token, expires_at: Date.now() + (body.expires_in - 60) * 1000 });
}

async function refreshTokens(refresh_token) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: basicAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token }),
  });
  if (!res.ok) throw await tokenError(res, 'Constant Contact token refresh failed');
  const body = await res.json();
  const tokens = { access_token: body.access_token, refresh_token: body.refresh_token || refresh_token, expires_at: Date.now() + (body.expires_in - 60) * 1000 };
  writeTokens(tokens);
  return tokens;
}

async function getValidAccessToken() {
  creds(); // throws NO_API_KEY early if the app credentials aren't set at all
  let tokens = readTokens();
  if (!tokens) {
    const err = new Error('Constant Contact is not connected yet. Visit /auth/constantcontact/start and approve access once.');
    err.code = 'NOT_CONNECTED';
    throw err;
  }
  if (Date.now() >= tokens.expires_at) tokens = await refreshTokens(tokens.refresh_token);
  return tokens.access_token;
}

async function ccGet(path) {
  const token = await getValidAccessToken();
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw await tokenError(res, `Constant Contact request to ${path} failed`);
  return res.json();
}

// Response shapes not verified live (network-restricted while building this).
// Pulls recent email campaigns and their reporting stats for the current
// month; fails loudly with the raw shape if a field isn't where expected,
// rather than guessing at a number.
async function getSummary() {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const activity = await ccGet('/emails/activities?limit=50');
  const campaigns = (activity.campaign_activities || activity.results || activity.items || [])
    .filter(c => new Date(c.created_at || c.send_date || 0) >= monthStart);
  if (!campaigns.length) return { sends: 0, opens: 0, clicks: 0, byName: [] };
  const stats = await Promise.all(campaigns.map(async c => {
    const id = c.campaign_activity_id || c.campaign_id || c.id;
    const r = await ccGet(`/reports/campaign_tracking_reports/${id}`).catch(() => null);
    return { name: c.subject || c.name || id, sends: r?.sends ?? 0, opens: r?.unique_opens ?? r?.opens ?? 0, clicks: r?.unique_clicks ?? r?.clicks ?? 0 };
  }));
  return {
    sends: stats.reduce((a, s) => a + s.sends, 0),
    opens: stats.reduce((a, s) => a + s.opens, 0),
    clicks: stats.reduce((a, s) => a + s.clicks, 0),
    byName: stats.map(s => [s.name, s.opens]).sort((a, b) => b[1] - a[1]),
  };
}

module.exports = { getAuthUrl, exchangeCode, getSummary, isConnected: () => !!readTokens() };
