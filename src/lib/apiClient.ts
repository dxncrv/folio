// Client-side fetch helper used by stores and components.
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status = 500, body: any = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Enhanced fetch wrapper with JSON parsing and error handling.
 * Auth is cookie-based (admin_session / talk_username) — credentials are sent automatically.
 */
export async function fetchJson(input: RequestInfo, init?: RequestInit) {
  // Ensure credentials are sent for same-origin requests to include
  // 'admin_session' and 'talk_username' cookies automatically.
  if (init && !init.credentials) {
    init.credentials = 'same-origin';
  } else if (!init) {
    init = { credentials: 'same-origin' };
  }

  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';
  let body: any = null;
  
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const msg = (body && body.error) ? body.error : res.statusText || 'Request failed';
    throw new ApiError(msg, res.status, body);
  }

  return body;
}
