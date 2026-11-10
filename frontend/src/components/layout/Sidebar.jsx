import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Tent,
  Package,
  Activity,
  X,
  ShieldCheck,
  Building2,
  Heart,
} from 'lucide-react';
import { Button } from '../ui/button';

// Clean, streamlined navigation per role (redundant search/add/filter sub-tabs consolidated)
const roleMenuItems = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Blood Inventory', path: '/inventory', icon: Package, badge: 'Live' },
    { label: 'Donors Directory', path: '/donors', icon: Users, badge: null },
    { label: 'Blood Requests', path: '/requests', icon: ClipboardList, badge: null },
    { label: 'Donation Camps', path: '/camps', icon: Tent, badge: null },
  ],
  hospital: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Blood Requisitions', path: '/requests', icon: ClipboardList, badge: 'Track' },
    { label: 'Blood Stock', path: '/inventory/stock', icon: Package, badge: null },
    { label: 'Donation Camps', path: '/camps', icon: Tent, badge: null },
  ],
  donor: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'My Donor Profile', path: '/donors/profile', icon: Users, badge: null },
    { label: 'Donation Camps', path: '/camps', icon: Tent, badge: 'Explore' },
    { label: 'Blood Availability', path: '/inventory/stock', icon: Activity, badge: null },
  ],
};

const roleMeta = {
  admin: {
    label: 'System Admin',
    icon: ShieldCheck,
    color: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  hospital: {
    label: 'Hospital Partner',
    icon: Building2,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  donor: {
    label: 'Blood Donor',
    icon: Heart,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

export default function Sidebar({ isOpen, onClose }) {
  const { userProfile, user } = useAuth();
  const role = userProfile?.role || 'donor';
  const items = roleMenuItems[role] || roleMenuItems.donor;
  const currentRoleMeta = roleMeta[role] || roleMeta.donor;
  const RoleIcon = currentRoleMeta.icon;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col justify-between shadow-xs',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Mobile Header Close */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 lg:hidden">
            <span className="font-semibold text-slate-800 text-sm">Navigation Menu</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Role Status Tag */}
          <div className="px-4 pt-4 pb-2">
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium', currentRoleMeta.color)}>
              <RoleIcon className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{currentRoleMeta.label}</span>
              <span className={cn('h-2 w-2 rounded-full shrink-0 animate-pulse', currentRoleMeta.dot)} />
            </div>
          </div>

          {/* Streamlined Main Nav Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-red-50/90 text-red-700 font-semibold shadow-xs border border-red-100/70'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-red-600" />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded-md border',
                            isActive
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Compact Footer Profile Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white font-semibold text-xs shadow-xs">
              {user?.displayName?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Logged In'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Demo Session'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
