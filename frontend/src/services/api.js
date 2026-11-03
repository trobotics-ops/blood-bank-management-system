import { auth } from '../lib/firebase';

const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

async function getAuthHeaders() {
  const currentUser = auth?.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch {
      // Continue to check local demo token
    }
  }

  const demoToken = typeof window !== 'undefined' ? localStorage.getItem('demo_token') : null;
  if (demoToken) {
    return {
      Authorization: `Bearer ${demoToken}`,
      'Content-Type': 'application/json',
    };
  }

  return { 'Content-Type': 'application/json' };
}

async function handleResponse(response) {
  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function apiGet(endpoint) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });
  return handleResponse(response);
}

export async function apiPost(endpoint, body) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiPut(endpoint, body) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiPatch(endpoint, body) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiDelete(endpoint) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse(response);
}
