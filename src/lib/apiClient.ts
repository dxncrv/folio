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
 * Extended fetch options with optional auth flag
 */
export interface FetchOptions extends RequestInit {
  requiresAuth?: boolean; // Flag for admin endpoints that need authentication
}


/**
 * Enhanced fetch wrapper with automatic auth header injection
 * 
 * @param input - URL or Request object
 * @param options - Fetch options with optional requiresAuth flag
 * @returns Parsed JSON response body
 * @throws ApiError with status and body on failure
 */
export async function fetchJson(input: RequestInfo, options?: FetchOptions) {
  const { requiresAuth, ...init } = options || {};
  
  // Note: Modern auth uses the 'pb_auth' cookie which is automatically 
  // included in same-origin requests by the browser.

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
