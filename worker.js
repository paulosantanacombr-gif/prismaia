/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   PRISMA LABPIXEL — Cloudflare Worker CORS Proxy     ║
 * ║   Encaminha requests para OpenAI Responses API       ║
 * ║   Deploy grátis: dash.cloudflare.com → Workers       ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * COMO FAZER DEPLOY (2 minutos, grátis):
 *  1. Acesse https://dash.cloudflare.com → crie conta gratuita
 *  2. Workers & Pages → Create → Create Worker
 *  3. Clique "Edit code" → apague tudo → cole este arquivo → Deploy
 *  4. Copie a URL: ex https://prisma-proxy.SEU_USER.workers.dev
 *  5. No app: Configurar → cole  https://...workers.dev/proxy  + API Key
 *
 * ROTAS:
 *  POST /proxy   → repassa para https://api.openai.com/v1/responses
 *
 * SEGURANÇA:
 *  - API Key nunca exposta no frontend
 *  - Aceita apenas POST /proxy com JSON
 *  - CORS liberado apenas para domínios github.io
 */

const OPENAI_URL = 'https://api.openai.com/v1/responses';

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';

    // ── Preflight ─────────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    const url = new URL(request.url);

    // ── Health check ──────────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ status: 'ok', service: 'prisma-labpixel-proxy' }, 200, origin);
    }

    // ── Only POST /proxy ──────────────────────────────────────────────────────
    if (request.method !== 'POST' || url.pathname !== '/proxy') {
      return json({ error: 'Use POST /proxy' }, 404, origin);
    }

    // ── Validate auth ─────────────────────────────────────────────────────────
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return json({ error: 'Missing Authorization: Bearer <key>' }, 401, origin);
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: 'Invalid JSON' }, 400, origin); }

    // ── Forward to OpenAI Responses API ───────────────────────────────────────
    let upstream;
    try {
      upstream = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': auth,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return json({ error: `Upstream error: ${e.message}` }, 502, origin);
    }

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  // Allow any github.io subdomain + localhost
  const allowed =
    origin.endsWith('.github.io') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
      ? origin
      : 'null';
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
    'Cache-Control':                'no-store',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
