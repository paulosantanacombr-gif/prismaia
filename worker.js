/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   PRISMA LABPIXEL — Cloudflare Worker CORS Proxy     ║
 * ║   Encaminha requests para BytePlus ModelArk API      ║
 * ║   Deploy grátis: dash.cloudflare.com → Workers       ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * COMO FAZER DEPLOY (5 minutos, grátis):
 *  1. Acesse https://dash.cloudflare.com
 *  2. Crie conta gratuita (ou faça login)
 *  3. Vá em Workers & Pages → Create → Create Worker
 *  4. Cole TODO este código no editor e clique "Deploy"
 *  5. Copie a URL do Worker (ex: prisma-proxy.SEU_USER.workers.dev)
 *  6. Cole essa URL no campo "Proxy URL" do app Prisma LabPixel
 *
 * ROTAS SUPORTADAS:
 *  POST /proxy  → encaminha para BytePlus /images/generations
 *
 * SEGURANÇA:
 *  - A API Key NUNCA fica exposta no frontend
 *  - O Worker apenas repassa o Authorization header recebido
 *  - Aceita apenas POST com Content-Type application/json
 *  - CORS restrito ao domínio github.io (ajuste ALLOWED_ORIGINS)
 */

// ── Domínios permitidos (adicione o seu github.io aqui) ─────────────────────
const ALLOWED_ORIGINS = [
  'https://paulosantanacombr-gif.github.io',
  'http://localhost',
  'http://127.0.0.1',
  // Adicione outros domínios se necessário:
  // 'https://meusite.com',
];

// ── Endpoints BytePlus por região ────────────────────────────────────────────
const BYTEPLUS_ENDPOINTS = {
  'ap-southeast-1': 'https://ark.ap-southeast.bytepluses.com/api/v3',
  'eu-west-1':      'https://ark.eu-west.bytepluses.com/api/v3',
};

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse(origin);
    }

    // ── Apenas POST /proxy ────────────────────────────────────────────────────
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/proxy') {
      return jsonError(404, 'Not found. Use POST /proxy');
    }

    // ── Valida Content-Type ───────────────────────────────────────────────────
    const ct = request.headers.get('Content-Type') || '';
    if (!ct.includes('application/json')) {
      return jsonError(400, 'Content-Type must be application/json');
    }

    // ── Lê Authorization da requisição do browser ─────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError(401, 'Missing Authorization: Bearer <key>');
    }

    // ── Lê o body JSON ────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonError(400, 'Invalid JSON body');
    }

    // ── Escolhe região pelo header X-Region ou padrão ap-southeast-1 ──────────
    const region   = request.headers.get('X-Region') || 'ap-southeast-1';
    const baseUrl  = BYTEPLUS_ENDPOINTS[region] || BYTEPLUS_ENDPOINTS['ap-southeast-1'];
    const target   = `${baseUrl}/images/generations`;

    // ── Encaminha para BytePlus ───────────────────────────────────────────────
    let upstream;
    try {
      upstream = await fetch(target, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': authHeader,          // repassa a chave do usuário
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return jsonError(502, `Upstream fetch failed: ${e.message}`);
    }

    // ── Lê resposta upstream ──────────────────────────────────────────────────
    const upstreamText = await upstream.text();

    // ── Retorna com CORS headers ──────────────────────────────────────────────
    return new Response(upstreamText, {
      status: upstream.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': allowedOrigin(origin),
        'Access-Control-Allow-Methods':'POST, OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Region',
        'Cache-Control':               'no-store',
      },
    });
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function allowedOrigin(origin) {
  // Permite qualquer subdomínio github.io durante desenvolvimento
  if (origin.endsWith('.github.io') || ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[0];
}

function corsPreflightResponse(origin) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  allowedOrigin(origin),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Region',
      'Access-Control-Max-Age':       '86400',
    },
  });
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
