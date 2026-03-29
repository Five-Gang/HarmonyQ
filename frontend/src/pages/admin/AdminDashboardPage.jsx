import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Disc3, Users, ListMusic, TrendingUp, Plus, Music2,
  ArrowUpRight, Clock, Activity, BarChart3, Star
} from 'lucide-react';
import { useSongs, useTrendingSongs } from '../../hooks/useSongs';
import { useAdminPlaylists } from '../../hooks/usePlaylists';
import { SongRow } from '../../components/songs/SongCard.jsx';
import { SkeletonList } from '../../components/ui/LoadingStates.jsx';

const StatCard = ({ icon: Icon, value, label, change, gradient, to }) => {
  const Wrapper = to ? Link : 'div';
  return (
    <Wrapper
      to={to}
      className={`relative overflow-hidden rounded-2xl border border-white/5 p-5 transition-all duration-300 ${to ? 'hover:-translate-y-0.5 hover:border-white/10 hover:shadow-glow cursor-pointer' : ''}`}
      style={{ background: 'linear-gradient(135deg, #16162a 0%, #1e1e35 100%)' }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: gradient }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
          {change && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3 h-3" />
              {change}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: gradient }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Wrapper>
  );
};

const QuickActionCard = ({ icon: Icon, title, description, to, gradient }) => (
  <Link
    to={to}
    className="group flex items-center gap-4 rounded-2xl bg-surface-1 border border-white/5 p-4 transition-all duration-300 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-glow"
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ background: gradient }}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
  </Link>
);

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { data: songsData } = useSongs({ page: 1, limit: 1 });
  const { data: playlistsData } = useAdminPlaylists({ page: 1, limit: 1 });
  const { data: trendingData, isLoading: trendingLoading } = useTrendingSongs(5);

  const totalSongs = songsData?.pagination?.total || 0;
  const totalPlaylists = playlistsData?.pagination?.total || 0;
  const trending = trendingData?.data || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-900/30 via-surface-2 to-orange-900/10 p-8 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-slate-400 text-sm mb-1">{greeting},</p>
          <h1 className="text-4xl font-bold text-white mb-2">
            {user?.firstName || 'Admin'} 🛡️
          </h1>
          <p className="text-slate-300">
            Manage your music catalog, playlists, and users from one place.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Disc3}
          value={totalSongs.toLocaleString()}
          label="Total Songs"
          change="+12 this week"
          gradient="linear-gradient(135deg, #2b4ef7, #1530ec)"
          to="/admin/songs"
        />
        <StatCard
          icon={ListMusic}
          value={totalPlaylists.toLocaleString()}
          label="Total Playlists"
          gradient="linear-gradient(135deg, #a855f7, #9333ea)"
          to="/admin/playlists"
        />
        <StatCard
          icon={Users}
          value="—"
          label="Active Users"
          gradient="linear-gradient(135deg, #059669, #047857)"
          to="/admin/users"
        />
        <StatCard
          icon={BarChart3}
          value={trending[0]?.playCount?.toLocaleString() || '—'}
          label="Top Song Plays"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
        />
      </div>

      {/* Quick Actions + Trending */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <QuickActionCard
              icon={Plus}
              title="Add New Song"
              description="Add a new track to the catalog"
              to="/admin/songs"
              gradient="linear-gradient(135deg, #2b4ef7, #a855f7)"
            />
            <QuickActionCard
              icon={Music2}
              title="Manage Song Catalog"
              description={`Browse and edit ${totalSongs} songs`}
              to="/admin/songs"
              gradient="linear-gradient(135deg, #059669, #047857)"
            />
            <QuickActionCard
              icon={Star}
              title="View Trending"
              description="See what's popular right now"
              to="/admin/songs"
              gradient="linear-gradient(135deg, #f59e0b, #d97706)"
            />
          </div>
        </div>

        {/* Trending Songs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              <h2 className="text-xl font-bold text-white">Top Trending</h2>
            </div>
            <Link to="/admin/songs" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>
          {trendingLoading ? (
            <SkeletonList count={5} />
          ) : (
            <div className="space-y-1">
              {trending.map((song, i) => (
                <SongRow key={song._id} song={song} index={i} showIndex />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
