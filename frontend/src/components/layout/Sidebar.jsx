import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  Droplets,
  ClipboardList,
  Tent,
  Package,
  Search,
  UserPlus,
  PlusCircle,
  AlertTriangle,
  BarChart3,
  CalendarPlus,
  CalendarCheck,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const menuItems = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { type: 'separator', label: 'Management' },
    { label: 'All Donors', path: '/donors', icon: Users },
    { label: 'Search Donors', path: '/donors/search', icon: Search },
    { type: 'separator', label: 'Inventory' },
    { label: 'Blood Inventory', path: '/inventory', icon: Package },
    { label: 'Add Blood Unit', path: '/inventory/add', icon: PlusCircle },
    { label: 'Blood Stock', path: '/inventory/stock', icon: BarChart3 },
    { label: 'Expiring Units', path: '/inventory/expiring', icon: AlertTriangle },
    { type: 'separator', label: 'Requests' },
    { label: 'All Requests', path: '/requests', icon: ClipboardList },
    { type: 'separator', label: 'Camps' },
    { label: 'All Camps', path: '/camps', icon: Tent },
    { label: 'Create Camp', path: '/camps/create', icon: CalendarPlus },
  ],
  hospital: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { type: 'separator', label: 'Search' },
    { label: 'Search Donors', path: '/donors/search', icon: Search },
    { label: 'Blood Stock', path: '/inventory/stock', icon: BarChart3 },
    { type: 'separator', label: 'Requests' },
    { label: 'My Requests', path: '/requests', icon: ClipboardList },
    { label: 'New Request', path: '/requests/new', icon: PlusCircle },
    { type: 'separator', label: 'Camps' },
    { label: 'Blood Camps', path: '/camps', icon: Tent },
  ],
  donor: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { type: 'separator', label: 'Profile' },
    { label: 'My Profile', path: '/donors/profile', icon: Users },
    { label: 'Register as Donor', path: '/donors/register', icon: UserPlus },
    { type: 'separator', label: 'Blood' },
    { label: 'Blood Stock', path: '/inventory/stock', icon: BarChart3 },
    { type: 'separator', label: 'Camps' },
    { label: 'Upcoming Camps', path: '/camps', icon: Tent },
    { label: 'My Camps', path: '/camps/my', icon: CalendarCheck },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { userProfile } = useAuth();
  const role = userProfile?.role || 'donor';
  const items = menuItems[role] || menuItems.donor;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-background transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-semibold text-foreground">Navigation</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {items.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <div key={index} className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      {item.label}
                    </p>
                    <Separator className="mt-2" />
                  </div>
                );
              }

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-primary'
                        : 'text-muted hover:bg-secondary hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="rounded-md bg-accent/50 p-3">
              <p className="text-xs font-medium text-primary">Blood Bank System</p>
              <p className="text-xs text-muted mt-1">v1.0.0 — Cloud Edition</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
