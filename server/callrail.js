const BASE = 'https://api.callrail.com/v3';

// Standard v3 fields, confirmed against CallRail's public docs. Requested
// narrowly rather than the full default set to keep responses small.
const FIELDS = ['answered', 'duration', 'start_time', 'tracking_phone_number',
  'formatted_tracking_phone_number', 'customer_phone_number', 'voicemail', 'first_call', 'direction'].join(',');

function authHeader() {
  const key = process.env.CALLRAIL_API_KEY;
  if (!key) {
    const err = new Error('CALLRAIL_API_KEY is not set on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
  return { Authorization: `Token token="${key}"` };
}

async function apiError(res, prefix) {
  const text = await res.text().catch(() => '');
  const err = new Error(`${prefix} (HTTP ${res.status}): ${text.slice(0, 300)}`);
  err.status = res.status;
  return err;
}

// The API key can see more than one CallRail account; CALLRAIL_ACCOUNT_ID
// pins one explicitly, otherwise the first account the key can see is used.
let cachedAccountId = null;
async function resolveAccountId() {
  if (process.env.CALLRAIL_ACCOUNT_ID) return process.env.CALLRAIL_ACCOUNT_ID;
  if (cachedAccountId) return cachedAccountId;
  const res = await fetch(`${BASE}/a.json`, { headers: authHeader() });
  if (!res.ok) throw await apiError(res, 'Failed to list CallRail accounts');
  const body = await res.json();
  const accounts = body.accounts || [];
  if (!accounts.length) throw new Error('This CallRail API key has no accessible accounts.');
  cachedAccountId = accounts[0].id;
  return cachedAccountId;
}

async function fetchCallsThisMonth() {
  const accountId = await resolveAccountId();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const calls = [];
  let page = 1;
  for (;;) {
    const url = `${BASE}/a/${accountId}/calls.json?fields=${encodeURIComponent(FIELDS)}&start_date=${start}&per_page=250&page=${page}`;
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) throw await apiError(res, 'Failed to fetch CallRail calls');
    const body = await res.json();
    const batch = body.calls || [];
    calls.push(...batch);
    if (batch.length < 250 || page > 20) break; // hard cap against runaway pagination
    page++;
  }
  return calls;
}

function fmtLen(totalSeconds) {
  const s = Math.round(totalSeconds || 0);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function summarize(calls) {
  const total = calls.length;
  const answeredCalls = calls.filter(c => c.answered);
  const answered = answeredCalls.length;
  const missed = total - answered;
  const firstTime = calls.filter(c => c.first_call).length;
  const avgSeconds = answeredCalls.length
    ? answeredCalls.reduce((a, c) => a + (c.duration || 0), 0) / answeredCalls.length : 0;

  const byNumber = {};
  calls.forEach(c => {
    const key = c.formatted_tracking_phone_number || c.tracking_phone_number || 'Unknown number';
    byNumber[key] = (byNumber[key] || 0) + 1;
  });

  const callerCounts = {};
  calls.forEach(c => { if (c.customer_phone_number) callerCounts[c.customer_phone_number] = (callerCounts[c.customer_phone_number] || 0) + 1; });

  return {
    total, answered, missed, firstTime, avgLength: fmtLen(avgSeconds),
    byNumber: Object.entries(byNumber).sort((a, b) => b[1] - a[1]),
    answeredInside30: answeredCalls.filter(c => (c.duration || 0) <= 30).length,
    voicemail: calls.filter(c => c.voicemail).length,
    missedNoVoicemail: calls.filter(c => !c.answered && !c.voicemail).length,
    repeatCallers: Object.values(callerCounts).filter(n => n > 1).length,
    after6pm: calls.filter(c => c.start_time && new Date(c.start_time).getHours() >= 18).length,
  };
}

async function getSummary() {
  const calls = await fetchCallsThisMonth();
  return summarize(calls);
}

module.exports = { getSummary };
