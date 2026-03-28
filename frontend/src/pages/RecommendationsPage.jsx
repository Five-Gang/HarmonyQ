import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Star, Sparkles, TrendingUp, Music, RefreshCw, Flame, History } from 'lucide-react';
import { useRecommendations, useTrendingSongs, useUserPreferences, useRecommendationsByGenre } from '../hooks/useUser';
import { SongCard } from '../components/songs/SongCard.jsx';
import { SkeletonCard, EmptyState, ErrorState } from '../components/ui/LoadingStates.jsx';
import { Badge } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useRecommendations(user?.id);
  const { data: trendingData, isLoading: trendingLoading, error: trendingError, refetch: refetchTrending } = useTrendingSongs(20);
  const { data: preferences } = useUserPreferences(user?.id);
  const { data: genreBasedData, isLoading: genreLoading } = useRecommendationsByGenre(
    user?.id,
    preferences?.preferences?.favoriteGenres,
    12,
    !!preferences?.preferences?.favoriteGenres?.length
  );

  const recommendations = data?.recommendations || [];
  const isPersonalized = data?.personalized;
  const basedOn = data?.basedOn;
  const trendingSongs = trendingData?.data || [];
  const genreRecommendations = genreBasedData?.data || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'recommendations') {
        await refetch();
        toast.success('Recommendations refreshed!');
      } else {
        await refetchTrending();
        toast.success('Trending songs refreshed!');
      }
    } catch (err) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  const tabClasses = (tab) => `px-6 py-3 font-medium transition-all flex items-center gap-2 ${
    activeTab === tab
      ? 'text-accent-400 border-b-2 border-accent-400'
      : 'text-muted hover:text-foreground'
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span>Discover Music</span>
            <Sparkles className="w-7 h-7 text-accent-400" />
          </h1>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading || trendingLoading}
          className={`btn-secondary transition-all ${isRefreshing ? 'opacity-70' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800 flex gap-8">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={tabClasses('recommendations')}
        >
          <Sparkles className="w-5 h-5" />
          For You
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={tabClasses('trending')}
        >
          <Flame className="w-5 h-5" />
          Trending
        </button>
      </div>

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-muted">
              {isPersonalized
                ? 'Personalized picks based on your taste'
                : 'Trending songs you might enjoy'}
            </p>

            {/* Strategy info */}
            {data && (
              <div className="card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {isPersonalized ? (
                    <>
                      <Badge variant="accent"><Star className="w-3 h-3 mr-1" /> Personalized</Badge>
                      {basedOn?.genres?.map((g) => <Badge key={g} variant="brand">{g}</Badge>)}
                    </>
                  ) : (
                    <>
                      <Badge variant="default"><TrendingUp className="w-3 h-3 mr-1" /> Trending</Badge>
                    </>
                  )}
                </div>
                <div className="text-slate-500 text-xs space-y-1">
                  <p className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Based on {basedOn?.listeningHistory || 0} songs from your listening history
                  </p>
                  <p>
                    Recently listened: {basedOn?.recentListens || 0} • Playlist songs: {basedOn?.playlistSongs || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Personalized Recommendations */}
            {error ? (
              <ErrorState message={error.message} onRetry={refetch} />
            ) : isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : recommendations.length === 0 ? (
              <EmptyState
                icon={Music}
                title="No recommendations yet"
                description="Add some songs to playlists and set your genre preferences to get personalized picks."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommendations.map((song) => (
                  <div key={song._id} className="relative group">
                    {/* Source badge */}
                    {song.source === 'listening_history' && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="bg-gradient-to-r from-purple-500 to-accent-500 rounded-full p-1 flex items-center justify-center shadow-lg" title={song.reason || 'Based on your listening history'}>
                          <History className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    )}
                    {song.source === 'genre' && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center shadow-lg" title={song.reason || 'Matches your preferences'}>
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                    )}
                    {/* Tooltip */}
                    {(song.reason || song.source) && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        {song.reason || (song.source === 'listening_history' ? 'Based on your listening history' : 'Matches your preferences')}
                      </div>
                    )}
                    <SongCard song={song} showActions={false} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Genre-Based Recommendations */}
          {genreRecommendations.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent-400" />
                  Your Favorite Genres
                </h3>
                <p className="text-muted text-sm mt-1">
                  Top picks from {preferences?.preferences?.favoriteGenres?.join(', ')}
                </p>
              </div>
              {genreLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {genreRecommendations.map((song) => (
                    <div key={song._id} className="relative group">
                      {/* Show badge if matched from listening history */}
                      {song.score > 5 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-gradient-to-r from-purple-500 to-accent-500 rounded-full p-1 flex items-center justify-center shadow-lg" title="Matches your listening history">
                            <History className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                      )}
                      {/* Tooltip */}
                      {song.score > 5 && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                          Matches your listening history
                        </div>
                      )}
                      <SongCard song={song} showActions={false} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          <p className="text-muted">Most played songs trending this week</p>

          {trendingError ? (
            <ErrorState message={trendingError.message} onRetry={refetchTrending} />
          ) : trendingLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : trendingSongs.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No trending songs"
              description="Check back later for trending recommendations."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trendingSongs.map((song, idx) => (
                <div key={song._id} className="relative">
                  {idx < 3 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                        {idx + 1}
                      </div>
                    </div>
                  )}
                  <SongCard song={song} showActions={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
