const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  data?: unknown;
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    ...options,
    headers,
    credentials: 'include',
    body: options.data ? JSON.stringify(options.data) : options.body,
  });

  if (response.status === 401) {
    const isLoginRequest = endpoint.includes('/auth/login');
    if (!isLoginRequest) {
      console.log('401 Unauthorized - redirecting to login');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || data.error?.message || 'Request failed');
  }

  return data.data;
}
