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

export const CAMP_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

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
  if (!status) return 'bg-gray-100 text-gray-800';
  const key = String(status).toLowerCase();
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    fulfilled: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-blue-100 text-blue-800',
    expired: 'bg-gray-100 text-gray-800',
    used: 'bg-blue-100 text-blue-800',
    discarded: 'bg-red-100 text-red-800',
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[key] || 'bg-gray-100 text-gray-800';
}

export function getUrgencyColor(urgency) {
  if (!urgency) return 'bg-gray-100 text-gray-800';
  const key = String(urgency).toLowerCase();
  const colors = {
    normal: 'bg-green-100 text-green-800',
    urgent: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[key] || 'bg-gray-100 text-gray-800';
}
