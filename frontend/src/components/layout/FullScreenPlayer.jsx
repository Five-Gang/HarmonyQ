import { usePlayer } from '../../context/PlayerContext';
import {
  Play, Pause, Volume2, VolumeX, Music, Loader2, ChevronDown, Heart, SkipBack, SkipForward, Repeat, Repeat1, X
} from 'lucide-react';
import { useState } from 'react';

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getRepeatIcon = (mode) => {
  if (mode === 'REPEAT_ONCE') return <Repeat1 className="w-5 h-5" />;
  if (mode === 'REPEAT_INFINITE') return <Repeat className="w-5 h-5" />;
  return <Repeat className="w-5 h-5 opacity-50" />;
};

const getRepeatTooltip = (mode) => {
  if (mode === 'REPEAT_ONCE') return 'Repeat once (click to stop repeating)';
  if (mode === 'REPEAT_INFINITE') return 'Repeat all (click for repeat once)';
  return 'Repeat off (click to repeat all)';
};

export default function FullScreenPlayer() {
  const {
    currentSong, isPlaying, progress, duration, volume, isMuted,
    isLoading, showFullScreenPlayer, toggleFullScreenPlayer,
    togglePlay, seek, changeVolume, toggleMute,
    playNext, playPrevious, repeatMode, toggleRepeatMode, closePlayer,
  } = usePlayer();

  const [isFavorite, setIsFavorite] = useState(false);

  if (!showFullScreenPlayer || !currentSong) return null;

  const currentTime = duration ? (progress / 100) * duration : 0;

  return (
    <div className="fixed inset-0 z-[999] bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <button
          onClick={toggleFullScreenPlayer}
          className="text-white hover:text-slate-300 transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-semibold text-slate-300">NOW PLAYING</h1>
        <button
          onClick={closePlayer}
          className="text-white hover:text-slate-300 transition-colors"
          title="Close player"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
        {/* Album Art */}
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-surface-3 flex-shrink-0 overflow-hidden shadow-2xl">
          {currentSong.coverUrl || currentSong.coverArt ? (
            <img
              src={currentSong.coverUrl || currentSong.coverArt}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-r from-brand-500 to-accent-500">
              <Music className="w-24 h-24 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Song Title & Artist */}
        <div className="text-center max-w-lg">
          <h2 className="text-2xl md:text-4xl font-bold text-white break-words mb-2">
            {currentSong.title}
          </h2>
          <p className="text-base md:text-lg text-slate-400">
            {currentSong.artist}
          </p>
        </div>

        {/* Progress Bar (Full Width, Large) */}
        <div className="w-full max-w-lg px-4">
          <div
            className="h-2 bg-surface-3 cursor-pointer group relative rounded-full overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = ((e.clientX - rect.left) / rect.width) * 100;
              seek(Math.max(0, Math.min(100, pct)));
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 relative group-hover:h-2.5 transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 md:px-8 py-8 border-t border-white/10">
        {/* Play/Pause + Controls */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`transition-colors ${
              isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            disabled={isLoading}
            className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-surface-2/20 disabled:opacity-50 transition-colors"
            title="Previous"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-glow disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 text-white fill-white" />
            ) : (
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            disabled={isLoading}
            className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-surface-2/20 disabled:opacity-50 transition-colors"
            title="Next"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
          <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            className="flex-1 h-1.5 accent-brand-500 cursor-pointer rounded-full"
          />
        </div>

        {/* Repeat Mode Control */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={toggleRepeatMode}
            disabled={isLoading}
            className={`transition-colors ${
              repeatMode === 'REPEAT_INFINITE'
                ? 'text-brand-400 hover:text-brand-300'
                : repeatMode === 'REPEAT_ONCE'
                ? 'text-accent-400 hover:text-accent-300'
                : 'text-slate-400 hover:text-white'
            } disabled:opacity-50`}
            title={getRepeatTooltip(repeatMode)}
          >
            {getRepeatIcon(repeatMode)}
          </button>
        </div>
      </div>
    </div>
  );
}
