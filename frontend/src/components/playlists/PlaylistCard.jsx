import { useState, useEffect } from 'react';
import { ListMusic, Lock, Globe, MoreVertical, Music, Trash2, Edit, Copy, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/index.jsx';
import { useDeletePlaylist, useDuplicatePlaylist, useFollowPlaylist, useUnfollowPlaylist } from '../../hooks/usePlaylists';
import { useNavigate } from 'react-router-dom';

export const PlaylistCard = ({ playlist, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFollowed, setIsFollowed] = useState(playlist?.isFollowing || false);
  const deletePlaylist = useDeletePlaylist();
  const duplicatePlaylist = useDuplicatePlaylist();
  const followPlaylist = useFollowPlaylist();
  const unfollowPlaylist = useUnfollowPlaylist();
  const navigate = useNavigate();

  // Sync follow status when playlist prop changes
  useEffect(() => {
    setIsFollowed(playlist?.isFollowing || false);
  }, [playlist?.isFollowing]);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${playlist.name}"?`)) {
      deletePlaylist.mutate(playlist._id);
    }
    setMenuOpen(false);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    duplicatePlaylist.mutate({ playlistId: playlist._id, playlist });
    setMenuOpen(false);
  };

  const handleFollow = (e) => {
    e.stopPropagation();
    if (isFollowed) {
      unfollowPlaylist.mutate(playlist._id, {
        onSuccess: () => setIsFollowed(false),
      });
    } else {
      followPlaylist.mutate(playlist._id, {
        onSuccess: () => setIsFollowed(true),
      });
    }
  };

  return (
    <div
      onClick={() => navigate(`/playlists/${playlist._id}`)}
      className="card-hover group relative rounded-2xl"
    >
      {/* Content wrapper with rounded corners */}
      <div className="overflow-hidden rounded-2xl">
        {/* Cover */}
        <div className="h-40 bg-gradient-to-br from-brand-900 to-accent-600/30 flex items-center justify-center rounded-t-2xl relative overflow-hidden">
        {playlist.coverImage ? (
          <img
            src={playlist.coverImage}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="grid grid-cols-2 gap-1 p-4 w-full h-full">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-slate-600" />
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-t from-black/50 to-transparent" />

        {/* Privacy badge */}
        <div className="absolute top-3 right-3">
          {playlist.isPublic ? (
            <Badge variant="success"><Globe className="w-3 h-3 mr-1" />Public</Badge>
          ) : (
            <Badge variant="muted"><Lock className="w-3 h-3 mr-1" />Private</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-sm truncate">{playlist.name}</h3>
            {playlist.description && (
              <p className="text-slate-500 text-xs mt-1 line-clamp-2">{playlist.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ListMusic className="w-3.5 h-3.5" />
            <span>{playlist.songIds?.length || 0} songs</span>
            <span className="text-slate-600">•</span>
            <span>{playlist.followerCount || 0} followers</span>
          </div>
          {playlist.isPublic && (
            <button
              onClick={handleFollow}
              disabled={followPlaylist.isPending || unfollowPlaylist.isPending}
              className={clsx(
                'px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1',
                isFollowed
                  ? 'bg-accent-500/20 text-accent-300 hover:bg-accent-500/30'
                  : 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30'
              )}
            >
              <Heart className={clsx('w-3 h-3', isFollowed && 'fill-accent-300')} />
              {isFollowed ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Menu button - outside overflow wrapper to allow dropdown */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-surface-3 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="dropdown right-0 top-8">
              <button onClick={(e) => { e.stopPropagation(); onEdit?.(playlist); setMenuOpen(false); }} className="dropdown-item">
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button onClick={handleDuplicate} disabled={duplicatePlaylist.isPending} className="dropdown-item">
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button onClick={handleDelete} className="dropdown-item text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />}
    </div>
  );
};
