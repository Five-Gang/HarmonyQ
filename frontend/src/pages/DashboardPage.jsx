import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Music2, ListMusic, Star, TrendingUp, Clock, Headphones } from 'lucide-react';
import { useTrendingSongs } from '../hooks/useSongs';
import { useUserPlaylists } from '../hooks/usePlaylists';
import { useRecommendations } from '../hooks/useUser';
import { SongRow } from '../components/songs/SongCard.jsx';
import { PlaylistCard } from '../components/playlists/PlaylistCard.jsx';
import { SkeletonList, SkeletonCard } from '../components/ui/LoadingStates.jsx';

const StatCard = ({ icon: Icon, value, label, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useUser();
  const clerkUserId = user?.id;

  const { data: trendingData, isLoading: trendingLoading } = useTrendingSongs(5);
  const { data: playlistsData, isLoading: playlistsLoading } = useUserPlaylists(clerkUserId);
  const { data: recsData } = useRecommendations(clerkUserId);

  const trending = trendingData?.data || [];
  const playlists = playlistsData?.playlists || [];
  const recs = recsData?.recommendations?.slice(0, 4) || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-900 via-surface-2 to-accent-600/20 p-8 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-slate-400 text-sm mb-1">{greeting},</p>
          <h1 className="text-4xl font-bold text-white mb-2">
            {user?.firstName || user?.username || 'Music Lover'} 👋
          </h1>
          <p className="text-slate-300 mb-6">
            {recsData?.personalized
              ? `We found ${recsData.recommendations?.length || 0} personalized picks for you today.`
              : 'Discover new music and manage your playlists.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/songs" className="btn-primary">
              <Music2 className="w-4 h-4" /> Browse Songs
            </Link>
            <Link to="/recommendations" className="btn-secondary">
              <Star className="w-4 h-4" /> My Recommendations
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListMusic} value={playlists.length} label="Playlists" color="bg-brand-600" />
        <StatCard icon={Music2} value={playlists.reduce((a, p) => a + (p.songIds?.length || 0), 0)} label="Total Songs" color="bg-accent-600" />
        <StatCard icon={Star} value={recsData?.recommendations?.length || 0} label="Recommendations" color="bg-emerald-600" />
        <StatCard icon={TrendingUp} value={trending[0]?.playCount?.toLocaleString() || '—'} label="Top Track Plays" color="bg-orange-600" />
      </div>

      {/* Trending & Playlists grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Trending */}
        <div>
          <div className="section-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              <h2 className="section-title">Trending Now</h2>
            </div>
            <Link to="/songs" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
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

        {/* My Playlists */}
        <div>
          <div className="section-header">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-accent-400" />
              <h2 className="section-title">My Playlists</h2>
            </div>
            <Link to="/playlists" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
          </div>
          {playlistsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <SkeletonCard /><SkeletonCard />
            </div>
          ) : playlists.length === 0 ? (
            <div className="card p-8 text-center">
              <ListMusic className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No playlists yet.</p>
              <Link to="/playlists" className="btn-primary mt-4 text-xs">Create one →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {playlists.slice(0, 4).map((pl) => (
                <PlaylistCard key={pl._id} playlist={pl} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Recommendations */}
      {recs.length > 0 && (
        <div>
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-emerald-400" />
              <h2 className="section-title">Picks for You</h2>
            </div>
            <Link to="/recommendations" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">See more →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recs.map((song) => (
              <div key={song._id} className="card p-4 hover:bg-surface-2 transition-colors cursor-pointer">
                <div className="w-full h-28 bg-gradient-to-br from-emerald-900/50 to-surface-3 rounded-xl mb-3 flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-slate-400 truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
