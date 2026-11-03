import { apiGet, apiPut } from './api';

export async function getNotifications() {
  return apiGet('/api/notifications');
}

export async function getUnreadCount() {
  return apiGet('/api/notifications/unread-count');
}

export async function markAsRead(notificationId) {
  return apiPut(`/api/notifications/${notificationId}/read`);
}

export async function markAllAsRead() {
  return apiPut('/api/notifications/read-all');
}
