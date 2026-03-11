import { clsx } from 'clsx';

export const LoadingSpinner = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' };
  return (
    <div className={clsx('relative', sizes[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
    </div>
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-surface">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="xl" />
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

export const SkeletonCard = () => (
  <div className="card p-4 space-y-3">
    <div className="skeleton h-40 w-full rounded-xl" />
    <div className="skeleton h-4 w-3/4 rounded" />
    <div className="skeleton h-3 w-1/2 rounded" />
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 card">
        <div className="skeleton h-12 w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
        <div className="skeleton h-4 w-12 rounded" />
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {Icon && (
      <div className="mb-6 p-5 rounded-full bg-surface-2 border border-white/5">
        <Icon className="w-10 h-10 text-slate-500" />
      </div>
    )}
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    {description && <p className="text-slate-400 text-sm mb-6 max-w-sm">{description}</p>}
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="mb-4 p-4 rounded-full bg-red-500/10 border border-red-500/20">
      <span className="text-3xl">⚠️</span>
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
    <p className="text-slate-400 text-sm mb-6">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary">Try Again</button>
    )}
  </div>
);
