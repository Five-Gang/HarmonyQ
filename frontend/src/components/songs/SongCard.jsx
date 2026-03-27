import { useState } from 'react';
import { Music, Play, Pause, Plus, MoreVertical, Clock, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/index.jsx';
import { useIncrementPlay, useDeleteSong } from '../../hooks/useSongs';
import { useUser } from '@clerk/clerk-react';
import { usePlayer } from '../../context/PlayerContext';

const formatDuration = (seconds) => {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const SongCard = ({ song, onAddToPlaylist, showActions = true }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const incrementPlay = useIncrementPlay();
  const deleteSong = useDeleteSong();
  const { user } = useUser();
  const { playSong, currentSong, isPlaying } = usePlayer();

  const isAdmin = user?.publicMetadata?.roles?.includes('admin');
  const isThisSongPlaying = currentSong?._id === song._id && isPlaying;

  const handlePlay = () => {
    playSong(song);
    incrementPlay.mutate(song._id);
  };

  return (
    <div className="card-hover group relative overflow-visible">
      {/* Cover Art */}
      <div className="relative h-44 bg-gradient-to-br from-surface-3 to-surface-4 overflow-hidden rounded-t-2xl">
        {song.coverUrl || song.coverArt ? (
          <img src={song.coverUrl || song.coverArt} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Music className="w-12 h-12 text-slate-600" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Play button */}
        <button
          onClick={handlePlay}
          className={clsx(
            'absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg',
            isThisSongPlaying
              ? 'bg-brand-500 scale-110 shadow-glow'
              : 'bg-white/10 backdrop-blur opacity-0 group-hover:opacity-100 hover:bg-brand-500 hover:scale-110'
          )}
        >
          {isThisSongPlaying
            ? <Pause className="w-4 h-4 text-white fill-white" />
            : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
        </button>

        {/* Genre badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="brand">{song.genre}</Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-sm truncate">{song.title}</h3>
            <p className="text-slate-400 text-xs truncate mt-0.5">{song.artist}</p>
            {song.album !== 'Single' && (
              <p className="text-slate-500 text-xs truncate mt-0.5">{song.album}</p>
            )}
          </div>
          {showActions && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-surface-3 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="dropdown right-0 top-8">
                  <button onClick={() => { onAddToPlaylist?.(song); setMenuOpen(false); }} className="dropdown-item">
                    <Plus className="w-4 h-4" /> Add to playlist
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { deleteSong.mutate(song._id); setMenuOpen(false); }}
                      className="dropdown-item text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatDuration(song.duration)}
          </span>
          <span>{song.releaseYear}</span>
          {song.playCount > 0 && <span>▶ {song.playCount.toLocaleString()}</span>}
        </div>
      </div>

      {/* Close menu on outside click */}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />}
    </div>
  );
};

export const SongRow = ({ song, index, onAddToPlaylist, onRemove, showIndex = false }) => {
  const incrementPlay = useIncrementPlay();
  const { playSong, currentSong, isPlaying } = usePlayer();
  const isThisSongPlaying = currentSong?._id === song._id && isPlaying;

  const handlePlay = () => {
    playSong(song);
    incrementPlay.mutate(song._id);
  };

  return (
    <div className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer">
      {/* Index/Play */}
      <div className="w-8 flex-shrink-0 text-center">
        <span className={clsx('text-sm text-slate-500 group-hover:hidden', isPlaying && 'hidden')}>
          {showIndex ? index + 1 : '♪'}
        </span>
        <button
          onClick={handlePlay}
          className={clsx('hidden group-hover:flex items-center justify-center', isThisSongPlaying && '!flex')}
        >
          {isThisSongPlaying
            ? <Pause className={clsx('w-4 h-4 fill-current text-brand-400')} />
            : <Play className={clsx('w-4 h-4 fill-current text-slate-300')} />}
        </button>
      </div>

      {/* Cover */}
      <div className="w-10 h-10 rounded-lg bg-surface-3 flex-shrink-0 overflow-hidden">
        {song.coverUrl || song.coverArt ? (
          <img src={song.coverUrl || song.coverArt} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Music className="w-4 h-4 text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{song.title}</p>
        <p className="text-xs text-slate-400 truncate">{song.artist}</p>
      </div>

      {/* Genre */}
      <Badge variant="brand" className="hidden sm:inline-flex">{song.genre}</Badge>

      {/* Duration */}
      <span className="text-sm text-slate-500 flex-shrink-0 hidden sm:block">{formatDuration(song.duration)}</span>

      {/* Actions */}
      {(onAddToPlaylist || onRemove) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddToPlaylist && (
            <button
              onClick={() => onAddToPlaylist(song)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
              title="Add to playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(song._id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
