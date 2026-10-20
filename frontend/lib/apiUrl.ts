// Backend base URL, shared by every API call. In production set NEXT_PUBLIC_API_URL on Vercel to
// the backend + "/api", e.g. https://xxx.up.railway.app/api (read at BUILD time: redeploy after changing it).
// Tolerant on purpose: a trailing slash is removed and a missing "/api" is added, since every
// backend route lives under /api/ (otherwise login answers 404 on "/auth/token/").
const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
export const API_URL = base.endsWith('/api') ? base : `${base}/api`;
