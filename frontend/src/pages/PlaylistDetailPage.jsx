import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, ListMusic, Globe, Lock, Plus, Music, Edit, Trash2 } from 'lucide-react';
import { usePlaylist } from '../hooks/usePlaylists';
import { useRemoveSongFromPlaylist } from '../hooks/usePlaylists';
import { useSongs } from '../hooks/useSongs';
import { useAddSongsToPlaylist } from '../hooks/usePlaylists';
import { SongRow } from '../components/songs/SongCard.jsx';
import { Modal, SearchBar, Badge } from '../components/ui/index.jsx';
import { SkeletonList, EmptyState, ErrorState, LoadingSpinner } from '../components/ui/LoadingStates.jsx';
import { useState } from 'react';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [songSearch, setSongSearch] = useState('');

  const { data, isLoading, error } = usePlaylist(id);
  const removeSong = useRemoveSongFromPlaylist();
  const addSongs = useAddSongsToPlaylist();

  const { data: songSearchData, isLoading: searchLoading } = useSongs({
    search: songSearch || undefined,
    limit: 10,
  });

  const playlist = data?.data;
  const isOwner = playlist?.clerkUserId === user?.id;
  const searchResults = songSearchData?.songs || [];

  const handleRemoveSong = (songId) => {
    removeSong.mutate({ playlistId: id, songId });
  };

  const handleAddSong = (songId) => {
    addSongs.mutate({ id, songIds: [songId] });
  };

  if (error) return (
    <ErrorState message={error.message} onRetry={() => navigate('/playlists')} />
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (!playlist) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/playlists')} className="btn-ghost">
        <ArrowLeft className="w-4 h-4" /> Back to Playlists
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="w-full sm:w-44 h-44 flex-shrink-0 bg-gradient-to-br from-brand-900 to-accent-600/30 rounded-2xl flex items-center justify-center">
            <ListMusic className="w-16 h-16 text-brand-400/50" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {playlist.isPublic ? (
                <Badge variant="success"><Globe className="w-3 h-3 mr-1" />Public</Badge>
              ) : (
                <Badge variant="muted"><Lock className="w-3 h-3 mr-1" />Private</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
            {playlist.description && <p className="text-slate-400 mb-4">{playlist.description}</p>}
            <p className="text-slate-500 text-sm">{playlist.songIds?.length || 0} songs</p>

            {isOwner && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowAddSongs(true)} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Songs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Song List */}
      <div>
        <h2 className="section-title mb-4">Songs</h2>
        {!playlist.songIds || playlist.songIds.length === 0 ? (
          <EmptyState
            icon={Music}
            title="No songs yet"
            description={isOwner ? 'Add songs to this playlist.' : 'This playlist is empty.'}
            action={isOwner && (
              <button onClick={() => setShowAddSongs(true)} className="btn-primary">
                Add Songs
              </button>
            )}
          />
        ) : (
          <div className="card overflow-hidden">
            <p className="text-slate-400 text-xs px-4 py-3 border-b border-white/5">
              Showing {playlist.songIds.length} song IDs. Expand to fetch metadata in a complete implementation.
            </p>
            {playlist.songIds.map((songId, i) => (
              <div key={songId} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-surface-2 transition-colors group">
                <span className="w-6 text-center text-sm text-slate-500">{i + 1}</span>
                <Music className="w-4 h-4 text-slate-600" />
                <code className="flex-1 text-xs text-slate-400 font-mono truncate">{songId}</code>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveSong(songId)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Songs Modal */}
      <Modal isOpen={showAddSongs} onClose={() => setShowAddSongs(false)} title="Add Songs" size="lg">
        <div className="space-y-4">
          <SearchBar value={songSearch} onChange={setSongSearch} placeholder="Search songs..." />
          <div className="max-h-80 overflow-y-auto space-y-1">
            {searchLoading ? <LoadingSpinner className="mx-auto" /> : searchResults.map((song) => (
              <div key={song._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors">
                <Music className="w-8 h-8 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{song.title}</p>
                  <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                </div>
                <button
                  onClick={() => handleAddSong(song._id)}
                  disabled={playlist.songIds?.includes(song._id) || addSongs.isPending}
                  className={`btn-${playlist.songIds?.includes(song._id) ? 'secondary' : 'primary'} text-xs py-1.5 px-3`}
                >
                  {playlist.songIds?.includes(song._id) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
