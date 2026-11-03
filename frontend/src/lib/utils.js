import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInDays, addDays } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date) {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date) {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function daysUntil(date) {
  if (!date) return null;
  return differenceInDays(new Date(date), new Date());
}

export function addDaysToDate(date, days) {
  return addDays(new Date(date), days);
}

export function getExpiryDate(componentType) {
  const expiryDays = {
    'Whole Blood': 35,
    'Packed RBCs': 42,
    'Platelets': 5,
    'Fresh Frozen Plasma': 365,
    'Cryoprecipitate': 365,
  };
  return addDays(new Date(), expiryDays[componentType] || 35);
}

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const COMPONENT_TYPES = [
  'Whole Blood',
  'Packed RBCs',
  'Platelets',
  'Fresh Frozen Plasma',
  'Cryoprecipitate',
];

export const URGENCY_LEVELS = ['Normal', 'Urgent', 'Critical'];

export const REQUEST_STATUSES = ['Pending', 'Approved', 'Rejected', 'Fulfilled'];

export function getStockColor(units) {
  if (units < 5) return 'text-red-600';
  if (units <= 10) return 'text-orange-500';
  return 'text-green-600';
}

export function getStockBgColor(units) {
  if (units < 5) return 'bg-red-100 text-red-800';
  if (units <= 10) return 'bg-orange-100 text-orange-800';
  return 'bg-green-100 text-green-800';
}

export function getStockBarColor(units) {
  if (units < 5) return '#DC2626';
  if (units <= 10) return '#F97316';
  return '#16A34A';
}

export function getStatusColor(status) {
  const colors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    Rejected: 'bg-red-100 text-red-800',
    Fulfilled: 'bg-green-100 text-green-800',
    Active: 'bg-green-100 text-green-800',
    Expired: 'bg-gray-100 text-gray-800',
    Used: 'bg-blue-100 text-blue-800',
    Discarded: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getUrgencyColor(urgency) {
  const colors = {
    Normal: 'bg-green-100 text-green-800',
    Urgent: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
  };
  return colors[urgency] || 'bg-gray-100 text-gray-800';
}
