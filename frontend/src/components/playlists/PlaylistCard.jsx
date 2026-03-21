import { useState } from 'react';
import { ListMusic, Lock, Globe, MoreVertical, Music, Trash2, Edit } from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/index.jsx';
import { useDeletePlaylist } from '../../hooks/usePlaylists';
import { useNavigate } from 'react-router-dom';

export const PlaylistCard = ({ playlist, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const deletePlaylist = useDeletePlaylist();
  const navigate = useNavigate();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${playlist.name}"?`)) {
      deletePlaylist.mutate(playlist._id);
    }
    setMenuOpen(false);
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
              <p className="text-slate-500 text-xs truncate mt-0.5">{playlist.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <ListMusic className="w-3.5 h-3.5" />
          <span>{playlist.songIds?.length || 0} songs</span>
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
