/**
 * Response and CORS Utilities for Cloudflare Workers
 */

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*, Content-Type, Cache-Control, Pragma, Authorization, X-Requested-With, X-Admin-Password",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
  "Content-Type": "application/json"
};

/**
 * Return successful JSON response
 */
export function jsonSuccess(data = {}, status = 200, extraHeaders = {}) {
  const body = {
    ok: true,
    ...data
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

/**
 * Return error JSON response
 */
export function jsonError(error = "error", message = "", status = 400, extra = {}) {
  const body = {
    ok: false,
    error,
    ...(message ? { message } : {}),
    ...extra
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS
  });
}

/**
 * Handle HTTP OPTIONS preflight request
 */
export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}
