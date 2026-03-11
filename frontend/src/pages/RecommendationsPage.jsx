import { useUser } from '@clerk/clerk-react';
import { Star, Sparkles, TrendingUp, Music, RefreshCw } from 'lucide-react';
import { useRecommendations } from '../hooks/useUser';
import { SongCard } from '../components/songs/SongCard.jsx';
import { SkeletonCard, EmptyState, ErrorState } from '../components/ui/LoadingStates.jsx';
import { Badge } from '../components/ui/index.jsx';

export default function RecommendationsPage() {
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useRecommendations(user?.id);

  const recommendations = data?.recommendations || [];
  const isPersonalized = data?.personalized;
  const basedOn = data?.basedOn;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span>Recommendations</span>
            <Sparkles className="w-7 h-7 text-accent-400" />
          </h1>
          <p className="text-muted mt-1">
            {isPersonalized
              ? 'Personalized picks based on your taste'
              : 'Trending songs you might enjoy'}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Strategy info */}
      {data && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          {isPersonalized ? (
            <>
              <Badge variant="accent"><Star className="w-3 h-3 mr-1" /> Personalized</Badge>
              {basedOn?.genres?.map((g) => <Badge key={g} variant="brand">{g}</Badge>)}
              <span className="text-slate-500 text-xs">
                Based on {basedOn?.recentListens || 0} recent listens and {basedOn?.playlistSongs || 0} playlist songs
              </span>
            </>
          ) : (
            <>
              <Badge variant="default"><TrendingUp className="w-3 h-3 mr-1" /> Trending</Badge>
              <span className="text-slate-500 text-xs">
                Set your favorite genres in your profile to get personalized picks!
              </span>
            </>
          )}
        </div>
      )}

      {/* Content */}
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
            <div key={song._id} className="relative">
              {song.source === 'genre' && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
              )}
              <SongCard song={song} showActions={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
