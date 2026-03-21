import { Sidebar } from './Sidebar';
import MiniPlayer from './MiniPlayer';
import FullScreenPlayer from './FullScreenPlayer';
import { SidebarProvider } from '../../context/SidebarContext';
import { useSidebar } from '../../context/SidebarContext';
import { clsx } from 'clsx';

const AppLayoutContent = ({ children }) => {
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      {/* lg offset for sidebar, mobile top bar */}
      <main className={clsx('flex-1 pt-0 lg:pt-0 transition-all duration-300', collapsed ? 'lg:ml-16' : 'lg:ml-64')}>
        <div className="lg:hidden h-14" /> {/* mobile top bar spacer */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 pb-28">
          {children}
        </div>
      </main>
      <FullScreenPlayer />
      <MiniPlayer />
    </div>
  );
};

export const AppLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
};
