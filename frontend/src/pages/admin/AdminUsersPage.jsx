import { Users, Construction } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
        <p className="text-slate-400 mt-1">View and manage registered users</p>
      </div>

      <div className="card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <Construction className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          User management features including user roles, activity logs, and user analytics will be available here.
        </p>
      </div>
    </div>
  );
}
