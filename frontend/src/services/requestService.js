import { apiGet, apiPost, apiPut } from './api';

export async function getAllRequests(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/requests${query ? `?${query}` : ''}`);
}

export async function getMyRequests() {
  return apiGet('/api/requests/my');
}

export async function getRequestById(id) {
  return apiGet(`/api/requests/${id}`);
}

export async function createRequest(requestData) {
  return apiPost('/api/requests', requestData);
}

export async function updateRequestStatus(id, status, notes) {
  return apiPut(`/api/requests/${id}/status`, { status, notes });
}

export async function getRequestStats() {
  return apiGet('/api/requests/stats');
}
