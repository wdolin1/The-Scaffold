const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-5';
const MAX_TOKENS_CEILING = 4096;

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY is not set on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
  if (!client) client = new Anthropic();
  return client;
}

// system/messages/tools are already in Anthropic Messages API shape; the
// caller (the browser) never sees the API key, only this proxy does.
async function runMessage({ system, messages, tools, max_tokens }) {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: Math.min(Number(max_tokens) || 1024, MAX_TOKENS_CEILING),
    system,
    messages,
    ...(tools && tools.length ? { tools } : {}),
  });
  return response;
}

module.exports = { runMessage, MODEL };
