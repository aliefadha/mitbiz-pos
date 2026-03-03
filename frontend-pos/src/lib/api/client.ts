const API_URL = 'https://backend-pos-508482854424.us-central1.run.app/api';

interface FetchOptions extends RequestInit {
  data?: unknown;
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { authClient } = await import('../auth-client');
  const session = await authClient.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(session?.data?.session?.token
      ? { Authorization: `Bearer ${session.data.session.token}` }
      : {}),
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
