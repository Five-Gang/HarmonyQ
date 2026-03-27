import { usePlayer } from '../../context/PlayerContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  Play, Pause, Volume2, VolumeX, Music, Loader2, X, SkipBack, SkipForward, Repeat, Repeat1
} from 'lucide-react';
import { clsx } from 'clsx';

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getRepeatIcon = (mode) => {
  if (mode === 'REPEAT_ONCE') return <Repeat1 className="w-4 h-4" />;
  if (mode === 'REPEAT_INFINITE') return <Repeat className="w-4 h-4" />;
  return <Repeat className="w-4 h-4 opacity-50" />;
};

const getRepeatTooltip = (mode) => {
  if (mode === 'REPEAT_ONCE') return 'Repeat once (click to stop repeating)';
  if (mode === 'REPEAT_INFINITE') return 'Repeat all (click for repeat once)';
  return 'Repeat off (click to repeat all)';
};

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, progress, duration, volume, isMuted,
    isLoading, error, toggleFullScreenPlayer,
    togglePlay, seek, changeVolume, toggleMute, clearError,
    playNext, playPrevious, repeatMode, toggleRepeatMode,
    queue, currentIndex, closePlayer,
  } = usePlayer();

  const { collapsed } = useSidebar();
  const nextSong = queue && currentIndex !== -1 && currentIndex < queue.length - 1 ? queue[currentIndex + 1] : null;

  if (error && !currentSong) {
    return (
      <div className={clsx('fixed bottom-0 right-0 z-50 bg-red-900/90 backdrop-blur border-t border-red-500/30 px-4 py-3 flex items-center justify-between transition-all duration-300', collapsed ? 'lg:left-16' : 'lg:left-64', 'left-0')}>
        <p className="text-red-300 text-sm">{error}</p>
        <button onClick={clearError} className="text-red-400 hover:text-red-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!currentSong) return null;

  const currentTime = duration ? (progress / 100) * duration : 0;

  return (
    <div className={clsx('fixed bottom-0 right-0 z-50 bg-surface-1/95 backdrop-blur-xl border-t border-white/8 shadow-2xl transition-all duration-300', collapsed ? 'lg:left-16' : 'lg:left-64', 'left-0')}>
      {/* Error banner above player */}
      {error && (
        <div className="bg-red-900/80 border-b border-red-500/30 px-4 py-2 flex items-center justify-between">
          <p className="text-red-300 text-xs">{error}</p>
          <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-4">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Progress bar — full width, clickable */}
      <div
        className="h-1 bg-surface-3 cursor-pointer group relative"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          seek(Math.max(0, Math.min(100, pct)));
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 relative group-hover:h-1.5 transition-all"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
        {/* Song info - clickable to open full screen */}
        <button
          onClick={toggleFullScreenPlayer}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
        >
          {/* Cover art */}
          <div className="w-10 h-10 rounded-lg bg-surface-3 flex-shrink-0 overflow-hidden">
            {currentSong.coverUrl || currentSong.coverArt ? (
              <img
                src={currentSong.coverUrl || currentSong.coverArt}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Music className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
          {/* Title + artist */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentSong.title}</p>
            <p className="text-xs text-slate-400 truncate">{currentSong.artist}</p>
          </div>
        </button>

        {/* Controls — center */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Time */}
          <span className="text-xs text-slate-500 hidden sm:block tabular-nums">
            {formatTime(currentTime)}
          </span>

          {/* Previous */}
          <button
            onClick={playPrevious}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-2 disabled:opacity-50 transition-colors"
            title="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-glow disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-2 disabled:opacity-50 transition-colors"
            title="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeatMode}
            disabled={isLoading}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              repeatMode === 'REPEAT_INFINITE' ? 'text-brand-400 hover:bg-surface-2' : repeatMode === 'REPEAT_ONCE' ? 'text-accent-400 hover:bg-surface-2' : 'text-slate-400 hover:text-white hover:bg-surface-2',
              'disabled:opacity-50'
            )}
            title={getRepeatTooltip(repeatMode)}
          >
            {getRepeatIcon(repeatMode)}
          </button>

          {/* Duration */}
          <span className="text-xs text-slate-500 hidden sm:block tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume — right */}
        <div className="flex items-center gap-2 flex-shrink-0 hidden md:flex">
          <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-brand-500 cursor-pointer"
          />
        </div>

        {/* Next song preview (small) - hidden on small screens */}
        {nextSong && (
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 pl-4 border-l border-white/10">
            <div className="text-right">
              <p className="text-xs text-slate-500">Next</p>
              <p className="text-xs font-medium text-white truncate max-w-[120px]">{nextSong.title}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex-shrink-0 overflow-hidden">
              {nextSong.coverUrl || nextSong.coverArt ? (
                <img
                  src={nextSong.coverUrl || nextSong.coverArt}
                  alt={nextSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Music className="w-3 h-3 text-slate-600" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={closePlayer}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-2 transition-colors flex-shrink-0"
          title="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
