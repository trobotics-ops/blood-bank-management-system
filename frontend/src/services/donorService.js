import { apiGet, apiPost, apiPut } from './api';

export async function getAllDonors(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/donors${query ? `?${query}` : ''}`);
}

export async function getDonorById(id) {
  return apiGet(`/api/donors/${id}`);
}

export async function getDonorProfile() {
  return apiGet('/api/donors/profile');
}

export async function registerDonor(donorData) {
  return apiPost('/api/donors', donorData);
}

export async function updateDonorProfile(donorData) {
  return apiPut('/api/donors/profile', donorData);
}

export async function searchDonors(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/donors/search${query ? `?${query}` : ''}`);
}

export async function getDonorDonationHistory() {
  return apiGet('/api/donors/history');
}

export async function getDonorStats() {
  return apiGet('/api/donors/stats');
}
