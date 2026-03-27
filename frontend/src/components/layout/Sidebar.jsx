import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useSidebar } from '../../context/SidebarContext';
import {
  Music2, Home, Search, ListMusic, Star, User, LogOut,
  ChevronLeft, ChevronRight, Settings, Menu, X, Shield
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/songs', icon: Search, label: 'Song Browser' },
  { to: '/playlists', icon: ListMusic, label: 'My Playlists' },
  { to: '/recommendations', icon: Star, label: 'Recommended' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export const Sidebar = () => {
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-6', collapsed && 'justify-center')}>
        <img src="/logo.svg" alt="Harmoniq" className="w-14 h-14 flex-shrink-0" />
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Harmoniq</h1>
            <p className="text-xs text-slate-500">Music Manager</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:bg-surface-2 hover:text-slate-200'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Admin Panel link — only for admins */}
        {user?.publicMetadata?.roles?.includes('admin') && (
          <>
            <div className="mx-1 my-2 border-t border-white/5" />
            <NavLink
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                    : 'text-red-400/60 hover:bg-red-500/10 hover:text-red-400'
                )
              }
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Admin Panel</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* User */}
      <div className={clsx('mt-auto p-3 border-t border-white/5', collapsed && 'flex justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img
              src={user?.imageUrl}
              alt={user?.fullName || 'User'}
              className="w-9 h-9 rounded-full border-2 border-brand-500/30 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-surface-1 border-r border-white/5 transition-all duration-300 z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-surface-3 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">Harmoniq</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-2 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-surface-1 border-r border-white/5 z-50 animate-slide-up">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};
