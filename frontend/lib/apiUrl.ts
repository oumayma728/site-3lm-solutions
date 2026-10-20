// Backend base URL, shared by every API call. In production set NEXT_PUBLIC_API_URL on Vercel to
// the backend + "/api", e.g. https://xxx.up.railway.app/api (read at BUILD time: redeploy after changing it).
// A trailing slash is removed, otherwise paths become "//auth/token/" and the backend answers 404.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
