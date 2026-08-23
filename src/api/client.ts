export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Derived by dropping the trailing "/api" — lets callers turn a
// backend-relative path (e.g. the local storage driver's "/uploads/...")
// into a URL that resolves against the API's own origin rather than the
// frontend's, which differ whenever the two are hosted separately (as in
// this app's actual S3 + EC2 deployment).
export const API_ORIGIN: string = API_BASE_URL.replace(/\/api\/?$/, '');

const TOKEN_KEY = 'revaudit.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
}

// Every request that has a token attaches it — the backend's public routes
// simply ignore it, and its admin-only routes require it. Callers never need
// to say which kind of route they're hitting.
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Is the backend running?', 0);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (some error responses, empty 204s) — leave data null.
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}
