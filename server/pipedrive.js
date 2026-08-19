const BASE = 'https://api.pipedrive.com/v1';

function tokenParam() {
  const token = process.env.PIPEDRIVE_API_TOKEN;
  if (!token) {
    const err = new Error('PIPEDRIVE_API_TOKEN is not set on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
  return `api_token=${encodeURIComponent(token)}`;
}

async function apiError(res, prefix) {
  const text = await res.text().catch(() => '');
  const err = new Error(`${prefix} (HTTP ${res.status}): ${text.slice(0, 300)}`);
  err.status = res.status;
  return err;
}

async function pdGet(path, params = '') {
  const url = `${BASE}${path}?${tokenParam()}${params ? '&' + params : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw await apiError(res, `Pipedrive request to ${path} failed`);
  const body = await res.json();
  if (body.success === false) throw new Error(`Pipedrive request to ${path} failed: ${JSON.stringify(body).slice(0, 300)}`);
  return body.data;
}

// Cached per server process; goals don't change often enough to look up every request.
let cachedGoals = null;
async function findGoalByTitle(title) {
  if (!cachedGoals) cachedGoals = (await pdGet('/goals')) || [];
  const needle = title.trim().toLowerCase();
  return cachedGoals.find(g => (g.title || '').trim().toLowerCase() === needle)
    || cachedGoals.find(g => (g.title || '').toLowerCase().includes(needle));
}

function monthBounds(d = new Date()) {
  const iso = x => x.toISOString().slice(0, 10);
  return { start: iso(new Date(d.getFullYear(), d.getMonth(), 1)), end: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
}

// The goal "results" endpoint computes progress for an arbitrary period
// regardless of how the goal itself is scheduled, so a goal named for the
// whole year still yields a correct month-to-date figure here. The exact
// response shape wasn't verified against a live account (network-restricted
// while building this), so extraction tries the documented field names and
// fails loudly, with the raw shape included, rather than guessing silently.
async function goalProgressThisMonth(title) {
  const goal = await findGoalByTitle(title);
  if (!goal) throw new Error(`No Pipedrive goal found matching "${title}". Check the exact title under Insights → Goals.`);
  const { start, end } = monthBounds();
  const result = await pdGet(`/goals/${goal.id}/results`, `period.start=${start}&period.end=${end}`);
  const progress = Array.isArray(result) ? result[0] : result;
  const target = progress?.goal?.expected_outcome?.target ?? progress?.expected_outcome?.target ?? goal?.expected_outcome?.target;
  const actual = progress?.progress?.value ?? progress?.progress ?? progress?.value ?? progress?.actual;
  if (target == null || actual == null) {
    throw new Error(`Pipedrive returned "${title}" in an unexpected shape: ${JSON.stringify(progress).slice(0, 300)}`);
  }
  return { target: Math.round(target), actual: Math.round(actual) };
}

async function getBrandPace() {
  const [ltw, sq] = await Promise.all([
    goalProgressThisMonth('2026 LTW count started'),
    goalProgressThisMonth('2026 SC count started'),
  ]);
  return { ltw, sq };
}

module.exports = { getBrandPace };
