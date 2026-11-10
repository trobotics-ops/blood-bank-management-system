import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Menu,
  Droplets,
  Activity,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import toast from 'react-hot-toast';

export default function Navbar({ onToggleSidebar }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationCount] = useState(3);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const role = userProfile?.role || 'donor';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center px-4 sm:px-6 gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-600 hover:text-slate-900"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Brand identity */}
        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-sm shadow-red-500/20 group-hover:scale-105 transition-transform duration-200">
            <Droplets className="h-5 w-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 leading-tight">
              Blood<span className="text-red-600">Bank</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 hidden sm:inline leading-none">
              Cloud Medical System
            </span>
          </div>
        </Link>

        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Firestore Cloud Connected</span>
        </div>

        <div className="flex-1" />

        {/* Actions: Notifications & User */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 hover:text-slate-900 rounded-xl"
            onClick={() => navigate('/notifications')}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                {notificationCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold uppercase shadow-xs">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span className="text-xs font-semibold text-slate-800">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                    {role}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg border-slate-200">
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.displayName || 'User Profile'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate('/donors/profile')}
                className="cursor-pointer rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <User className="mr-2 h-3.5 w-3.5 text-slate-500" />
                Donor Profile & ID Card
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/inventory/stock')}
                className="cursor-pointer rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Activity className="mr-2 h-3.5 w-3.5 text-slate-500" />
                Live Blood Stock
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
