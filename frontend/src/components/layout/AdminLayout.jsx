import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import {
  Music2, LayoutDashboard, Disc3, Users, ListMusic,
  LogOut, ChevronLeft, ChevronRight, Shield, ArrowLeft,
  Menu, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { PageLoader } from '../ui/LoadingStates.jsx';

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/songs', icon: Disc3, label: 'Manage Songs' },
  { to: '/admin/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/admin/users', icon: Users, label: 'Users' },
];

export function AdminLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const isAdmin = user?.publicMetadata?.roles?.includes('admin');
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-6', collapsed && 'justify-center')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Admin</h1>
            <p className="text-xs text-slate-500">Harmoniq Admin</p>
          </div>
        )}
      </div>

      {/* Back to app */}
      <div className="px-2 mb-2">
        <NavLink
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-surface-2 hover:text-slate-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {!collapsed && 'Back to App'}
        </NavLink>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-white/5 mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {adminNavItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                  : 'text-slate-400 hover:bg-surface-2 hover:text-slate-200'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={clsx('mt-auto p-3 border-t border-white/5', collapsed && 'flex justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img
              src={user?.imageUrl}
              alt={user?.fullName || 'Admin'}
              className="w-9 h-9 rounded-full border-2 border-red-500/30 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-red-400 truncate">Administrator</p>
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
    <div className="flex min-h-screen bg-surface">
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">Admin Panel</span>
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

      {/* Main content */}
      <main className={clsx('flex-1 transition-all duration-300', collapsed ? 'lg:ml-16' : 'lg:ml-64')}>
        <div className="lg:hidden h-14" />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
