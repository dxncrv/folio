// client-side fetch helper used by stores and components.
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status = 500, body: any = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function fetchJson(input: RequestInfo, init?: RequestInit) {
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

export default { fetchJson, ApiError };
