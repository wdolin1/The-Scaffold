/* claude-client.js — the real window.claude.complete. In Claude Design's own
   preview this global is injected by the host; on a deployed page there is no
   host to inject it, so this calls our own /api/claude/message proxy instead,
   which is the only thing holding the Anthropic API key.
   Returns the raw Anthropic Message ({content:[...], stop_reason, ...}) so
   callers can see tool_use blocks, not just text. */
(() => {
  async function complete({ system, messages, tools, max_tokens } = {}) {
    const res = await fetch('/api/claude/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, tools, max_tokens }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Claude request failed (${res.status})`);
    }
    return res.json();
  }
  // Pulls the plain text out of a Message's content blocks (thinking and
  // tool_use blocks are skipped), for callers that just want a string.
  function textOf(message) {
    return (message.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }
  window.claude = { complete };
  window.claudeTextOf = textOf;
})();
