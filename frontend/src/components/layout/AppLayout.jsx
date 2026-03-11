import { Sidebar } from './Sidebar';

export const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      {/* lg offset for sidebar, mobile top bar */}
      <main className="flex-1 lg:ml-64 pt-0 lg:pt-0 transition-all duration-300">
        <div className="lg:hidden h-14" /> {/* mobile top bar spacer */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
