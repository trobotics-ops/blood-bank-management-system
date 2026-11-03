import { apiGet, apiPost, apiPut, apiDelete } from './api';

export async function getInventory(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/inventory${query ? `?${query}` : ''}`);
}

export async function getBloodUnitById(id) {
  return apiGet(`/api/inventory/${id}`);
}

export async function addBloodUnit(unitData) {
  return apiPost('/api/inventory', unitData);
}

export async function updateBloodUnit(id, unitData) {
  return apiPut(`/api/inventory/${id}`, unitData);
}

export async function deleteBloodUnit(id) {
  return apiDelete(`/api/inventory/${id}`);
}

export async function getBloodStock() {
  return apiGet('/api/inventory/stock');
}

export async function getExpiringUnits(days = 7) {
  return apiGet(`/api/inventory/expiring?days=${days}`);
}

export async function getInventoryStats() {
  return apiGet('/api/inventory/stats');
}
