const BASE = 'https://api.companycam.com/v2';

function authHeader() {
  const token = process.env.COMPANYCAM_API_TOKEN;
  if (!token) {
    const err = new Error('COMPANYCAM_API_TOKEN is not set on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
  return { Authorization: `Bearer ${token}` };
}

async function apiError(res, prefix) {
  const text = await res.text().catch(() => '');
  const err = new Error(`${prefix} (HTTP ${res.status}): ${text.slice(0, 300)}`);
  err.status = res.status;
  return err;
}

async function ccGet(path, params = '') {
  const url = `${BASE}${path}${params ? '?' + params : ''}`;
  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) throw await apiError(res, `CompanyCam request to ${path} failed`);
  return res.json();
}

// Response shape not verified live (network-restricted while building this),
// so this normalizes a few plausible list shapes rather than assuming one.
function asList(body) {
  return Array.isArray(body) ? body : body.data || body.projects || body.photos || [];
}

let cachedProjects = null;
async function listProjects() {
  if (cachedProjects) return cachedProjects;
  const body = await ccGet('/projects', 'per_page=100');
  cachedProjects = asList(body).map(p => ({
    id: p.id, name: p.name || p.title || `Project ${p.id}`,
    address: p.address?.street_address_1 || (typeof p.address === 'string' ? p.address : null),
  }));
  return cachedProjects;
}

async function listPhotosForProject(projectId, limit) {
  const body = await ccGet(`/projects/${projectId}/photos`, `per_page=${limit}`);
  return asList(body).map(ph => ({
    id: ph.id,
    url: (Array.isArray(ph.uris) && (ph.uris.find(u => u.type === 'web')?.uri || ph.uris[0]?.uri)) || ph.photo_url || ph.uri || null,
    capturedAt: ph.captured_at || ph.created_at || null,
  }));
}

// No documented server-side project-name filter to build against, so this
// matches project name/address client-side, then pulls photos per match.
async function findPhotosByQuery(query, limit = 8) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { matches: [], photos: [] }; // an empty needle matches every project
  const projects = await listProjects();
  const matches = projects.filter(p => (p.name || '').toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q));
  if (!matches.length) return { matches: [], photos: [] };
  const perProject = await Promise.all(matches.slice(0, 3).map(p =>
    listPhotosForProject(p.id, limit).then(list => list.map(ph => ({ ...ph, project: p.name })))));
  const photos = perProject.flat().sort((a, b) => new Date(b.capturedAt || 0) - new Date(a.capturedAt || 0));
  return { matches: matches.map(m => m.name), photos: photos.slice(0, limit) };
}

module.exports = { listProjects, findPhotosByQuery };
