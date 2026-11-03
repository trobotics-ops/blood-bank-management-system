import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

export async function getAllCamps(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/camps${query ? `?${query}` : ''}`);
}

export async function getCampById(id) {
  return apiGet(`/api/camps/${id}`);
}

export async function createCamp(campData) {
  return apiPost('/api/camps', campData);
}

export async function updateCamp(id, campData) {
  return apiPut(`/api/camps/${id}`, campData);
}

export async function completeCamp(id, unitsCollected) {
  return apiPatch(`/api/camps/${id}/complete`, { unitsCollected });
}

export async function deleteCamp(id) {
  return apiDelete(`/api/camps/${id}`);
}

export async function registerForCamp(campId) {
  return apiPost(`/api/camps/${campId}/register`);
}

export async function unregisterFromCamp(campId) {
  return apiPost(`/api/camps/${campId}/unregister`);
}

export async function getMyCamps() {
  return apiGet('/api/camps/my');
}

export async function getCampRegistrations(campId) {
  return apiGet(`/api/camps/${campId}/registrations`);
}
