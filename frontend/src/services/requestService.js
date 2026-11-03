import { apiGet, apiPost, apiPut, apiPatch } from './api';

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

export async function approveRequest(id) {
  return apiPatch(`/api/requests/${id}/approve`);
}

export async function rejectRequest(id, rejectionReason) {
  return apiPatch(`/api/requests/${id}/reject`, { rejectionReason });
}

export async function fulfillRequest(id) {
  return apiPatch(`/api/requests/${id}/fulfill`);
}

export async function updateRequestStatus(id, status, notes) {
  return apiPut(`/api/requests/${id}/status`, { status, notes });
}

export async function getRequestStats() {
  return apiGet('/api/requests/stats');
}
