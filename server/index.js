require('dotenv').config();
const path = require('path');
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { runMessage } = require('./claude');
const callrail = require('./callrail');
const pipedrive = require('./pipedrive');
const companycam = require('./companycam');
const constantcontact = require('./constantcontact');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

app.get('/', (_req, res) => res.redirect('/Marketing%20Command%20Center.html'));

// Proxies to the Anthropic Messages API so the API key never reaches the
// browser. The client (wick-brain.js, mcc-builder.js) sends Messages-API
// shaped {system, messages, tools, max_tokens} and gets the raw Message back;
// any tool-use loop is driven by the client, since Wick's tools read/write
// the user's own localStorage data and can't run on the server.
app.post('/api/claude/message', async (req, res) => {
  try {
    const { system, messages, tools, max_tokens } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }
    const response = await runMessage({ system, messages, tools, max_tokens });
    res.json(response);
  } catch (err) {
    if (err && err.code === 'NO_API_KEY') {
      console.error('ANTHROPIC_API_KEY is not set — copy .env.example to .env and add one.');
      return res.status(503).json({ error: 'AI features are not configured on this server yet.' });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('Anthropic auth error:', err.message);
      return res.status(503).json({ error: 'AI backend is misconfigured (invalid API key).' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Rate limited, try again shortly.' });
    }
    if (err instanceof Anthropic.BadRequestError) {
      console.error('Anthropic bad request:', err.message);
      return res.status(400).json({ error: 'Request rejected by the model API.' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error:', err.status, err.message);
      return res.status(502).json({ error: 'AI backend error, try again.' });
    }
    console.error('Unexpected error in /api/claude/message:', err);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

// Live call-tracking numbers for the Command Center's CallRail channel screen.
app.get('/api/callrail/summary', async (_req, res) => {
  try {
    res.json(await callrail.getSummary());
  } catch (err) {
    if (err && err.code === 'NO_API_KEY') {
      console.error('CALLRAIL_API_KEY is not set — the CallRail channel screen will show sample data only.');
      return res.status(503).json({ error: 'CallRail is not configured on this server yet.' });
    }
    console.error('CallRail request failed:', err.message);
    res.status(502).json({ error: err.message || 'CallRail request failed.' });
  }
});

// Live leads-started-vs-goal for the Home dashboard's pace dials.
app.get('/api/pipedrive/pace', async (_req, res) => {
  try {
    res.json(await pipedrive.getBrandPace());
  } catch (err) {
    if (err && err.code === 'NO_API_KEY') {
      console.error('PIPEDRIVE_API_TOKEN is not set — the pace dials will show sample data only.');
      return res.status(503).json({ error: 'Pipedrive is not configured on this server yet.' });
    }
    console.error('Pipedrive request failed:', err.message);
    res.status(502).json({ error: err.message || 'Pipedrive request failed.' });
  }
});

// Photo search for Wick's find_job_photos tool — no dedicated screen yet,
// this just needs to answer "does this client have good pictures".
app.get('/api/companycam/search', async (req, res) => {
  try {
    res.json(await companycam.findPhotosByQuery(req.query.q || ''));
  } catch (err) {
    if (err && err.code === 'NO_API_KEY') {
      console.error('COMPANYCAM_API_TOKEN is not set — find_job_photos will report it is unavailable.');
      return res.status(503).json({ error: 'CompanyCam is not configured on this server yet.' });
    }
    console.error('CompanyCam request failed:', err.message);
    res.status(502).json({ error: err.message || 'CompanyCam request failed.' });
  }
});

// One-time OAuth approval flow. Visit /start in a browser, log into Constant
// Contact, approve access; /callback exchanges the code and stores tokens.
let ccOAuthState = null;
app.get('/auth/constantcontact/start', (_req, res) => {
  try {
    ccOAuthState = crypto.randomBytes(16).toString('hex');
    res.redirect(constantcontact.getAuthUrl(ccOAuthState));
  } catch (err) {
    res.status(503).send(err.code === 'NO_API_KEY'
      ? 'CONSTANT_CONTACT_CLIENT_ID / CONSTANT_CONTACT_CLIENT_SECRET are not set in .env yet.' : err.message);
  }
});
app.get('/auth/constantcontact/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.status(400).send(`Constant Contact declined: ${error}`);
  if (!state || state !== ccOAuthState) return res.status(400).send('State mismatch, start the connection again from /auth/constantcontact/start.');
  ccOAuthState = null;
  try {
    await constantcontact.exchangeCode(code);
    res.send('Constant Contact connected. You can close this tab and go back to the Command Center.');
  } catch (err) {
    console.error('Constant Contact token exchange failed:', err.message);
    res.status(502).send('Token exchange failed: ' + err.message);
  }
});
app.get('/api/constantcontact/summary', async (_req, res) => {
  try {
    res.json(await constantcontact.getSummary());
  } catch (err) {
    if (err && (err.code === 'NO_API_KEY' || err.code === 'NOT_CONNECTED')) {
      return res.status(503).json({ error: err.message });
    }
    console.error('Constant Contact request failed:', err.message);
    res.status(502).json({ error: err.message || 'Constant Contact request failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`The Scaffold · Marketing Command Center running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set — Wick and the Content Builder will not be able to generate anything until it is.');
  }
});
