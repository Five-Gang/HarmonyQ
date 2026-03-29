import { usePlayer } from '../../context/PlayerContext';
import {
  Play, Pause, Volume2, VolumeX, Music, Loader2, ChevronDown, Heart, SkipBack, SkipForward, Repeat, Repeat1, X, BookOpen, ListPlus, Trash2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '../../hooks/useUser';
import { useUserPlaylists, useAddSongsToPlaylist, useRemoveSongFromPlaylist } from '../../hooks/usePlaylists';

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getRepeatTooltip = (mode) => {
  if (mode === 'REPEAT_ONCE') return 'Repeat once (click to stop repeating)';
  if (mode === 'REPEAT_INFINITE') return 'Repeat all (click for repeat once)';
  return 'Repeat off (click to repeat all)';
};

const detectLanguage = (text) => {
  if (!text) return 'en';
  if (/[\u0D80-\u0DF8]/.test(text)) return 'si'; // Sinhala
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
  return 'en'; // English
};

const getLanguageName = (lang) => {
  const languages = {
    si: 'Sinhala',
    ta: 'Tamil',
    hi: 'Hindi',
    ar: 'Arabic',
    zh: 'Chinese',
    en: 'English',
  };
  return languages[lang] || 'Unknown';
};

const getRepeatIcon = (mode) => {
  if (mode === 'REPEAT_ONCE') {
    return <Repeat1 className="w-5 h-5" />;
  } else if (mode === 'REPEAT_INFINITE') {
    return <Repeat className="w-5 h-5" />;
  }
  return <Repeat className="w-5 h-5 opacity-50" />;
};

export default function FullScreenPlayer() {
  const {
    currentSong, isPlaying, progress, duration, volume, isMuted,
    isLoading, showFullScreenPlayer, toggleFullScreenPlayer,
    togglePlay, seek, changeVolume, toggleMute,
    playNext, playPrevious, repeatMode, toggleRepeatMode, closePlayer, currentPlaylistId,
  } = usePlayer();

  const { userId } = useAuth();
  const { data: favoritesData } = useFavorites(userId);
  const { data: playlistsData } = useUserPlaylists(userId);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addSongsToPlaylist = useAddSongsToPlaylist();
  const removeSongFromPlaylist = useRemoveSongFromPlaylist();

  const [showLyrics, setShowLyrics] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const detectedLanguage = currentSong?.lyrics ? detectLanguage(currentSong.lyrics) : 'en';

  const favoriteSongIds = favoritesData?.favoriteSongIds || [];
  const userPlaylists = playlistsData?.playlists || [];
  const isFavorite = currentSong?._id && favoriteSongIds.includes(currentSong._id);
  const currentPlaylist = userPlaylists.find(p => p._id === currentPlaylistId);

  const handleToggleFavorite = async () => {
    if (!userId || !currentSong?._id) return;
    
    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync({ clerkUserId: userId, songId: currentSong._id });
      } else {
        await addFavorite.mutateAsync({ clerkUserId: userId, songId: currentSong._id });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!currentSong?._id) return;
    
    try {
      await addSongsToPlaylist.mutateAsync({
        id: playlistId,
        songIds: [currentSong._id],
      });
      setShowPlaylistMenu(false);
    } catch (err) {
      console.error('Error adding to playlist:', err);
    }
  };

  const handleRemoveSong = async () => {
    if (!currentPlaylistId || !currentSong?._id) return;
    
    try {
      await removeSongFromPlaylist.mutateAsync({
        playlistId: currentPlaylistId,
        songId: currentSong._id,
      });
      setShowRemoveConfirm(false);
      // Skip to next song after removing
      playNext();
    } catch (err) {
      console.error('Error removing song:', err);
    }
  };

  // Debug: log when current song changes
  useEffect(() => {
    console.log('Current song:', currentSong);
    console.log('Has lyrics:', !!currentSong?.lyrics);
  }, [currentSong]);

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
        {/* Album Art or Lyrics View */}
        {showLyrics && currentSong?.lyrics ? (
          <div className="relative w-full max-w-2xl h-96 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 via-slate-900/80 to-black pointer-events-none z-0" />
            
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-accent-500/5 to-brand-500/5 animate-pulse pointer-events-none z-0" />
            
            {/* Scrollable lyrics content */}
            <div className="relative h-full flex flex-col overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/95 backdrop-blur-sm border border-white/10 z-10">
              {/* Header with badge */}
              <div className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-white/5 bg-gradient-to-r from-transparent via-accent-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-500/20">
                    <BookOpen className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">LYRICS</div>
                    <div className="inline-flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-white">{getLanguageName(detectedLanguage)}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-500/20 border border-accent-500/30 rounded-full text-xs text-accent-300 font-medium">
                        <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                        {detectedLanguage.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lyrics text with enhanced styling */}
              <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
                {/* Custom scrollbar styles via inline styles */}
                <style>{`
                  .lyrics-container::-webkit-scrollbar {
                    width: 6px;
                  }
                  .lyrics-container::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.3);
                  }
                  .lyrics-container::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.3);
                    border-radius: 3px;
                  }
                  .lyrics-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.5);
                  }
                `}</style>
                <div className="lyrics-container text-center leading-relaxed whitespace-pre-wrap text-lg md:text-xl">
                  <div className="space-y-2">
                    {currentSong.lyrics.split('\n').map((line, idx) => (
                      <div
                        key={idx}
                        className="text-slate-200 hover:text-white transition-all duration-200 hover:scale-105 hover:text-accent-300 cursor-default group"
                        style={{
                          animation: `slideInUp 0.5s ease-out ${idx * 0.05}s both`,
                          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}
                      >
                        {line || <span className="opacity-0">.</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gradient fade bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950/95 to-transparent pointer-events-none" />
            </div>

            {/* Add animations */}
            <style>{`
              @keyframes slideInUp {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes fade-in {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              .animate-fade-in {
                animation: fade-in 0.4s ease-in-out;
              }
            `}</style>
          </div>
        ) : (
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
        )}

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
        <div className="flex items-center justify-between gap-8 mb-8">
          {/* Left Side - Empty spacer for alignment */}
          <div className="flex-1" />

          {/* Center Controls */}
          <div className="flex items-center justify-center gap-8">
            {/* Repeat Mode Button */}
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

            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={addFavorite.isPending || removeFavorite.isPending}
              className={`transition-colors ${
                isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-white'
              } disabled:opacity-50`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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

            {/* Add to Playlist Button */}
            <div className="relative">
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                disabled={userPlaylists.length === 0}
                className={`p-3 rounded-full transition-colors ${
                  userPlaylists.length === 0
                    ? 'text-slate-600 cursor-not-allowed'
                    : showPlaylistMenu
                    ? 'text-accent-400 bg-accent-400/10'
                    : 'text-slate-400 hover:text-white hover:bg-surface-2/20'
                }`}
                title={userPlaylists.length === 0 ? 'No playlists available' : 'Add to playlist'}
              >
                <ListPlus className="w-6 h-6" />
              </button>

              {/* Playlist Menu Dropdown */}
              {showPlaylistMenu && userPlaylists.length > 0 && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 min-w-48 max-h-64 overflow-y-auto">
                  {userPlaylists.map((playlist) => (
                    <button
                      key={playlist._id}
                      onClick={() => handleAddToPlaylist(playlist._id)}
                      disabled={addSongsToPlaylist.isPending}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-white text-sm disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {playlist.name}
                      <span className="text-xs text-slate-400 block">{playlist.songIds?.length || 0} songs</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lyrics Button */}
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              disabled={!currentSong?.lyrics || currentSong.lyrics.trim().length === 0}
              className={`p-3 rounded-full transition-colors ${
                !currentSong?.lyrics || currentSong.lyrics.trim().length === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : showLyrics
                  ? 'text-accent-400 bg-accent-400/10 hover:text-accent-300'
                  : 'text-slate-400 hover:text-white hover:bg-surface-2/20'
              }`}
              title={currentSong?.lyrics && currentSong.lyrics.trim().length > 0 ? 'Show/Hide lyrics' : 'No lyrics available'}
            >
              <BookOpen className="w-6 h-6" />
            </button>
          </div>

          {/* Right Side - Remove from Playlist Button */}
          <div className="flex-1 flex justify-end">
            {currentPlaylistId && (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                disabled={removeSongFromPlaylist.isPending}
                className="p-3 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50 transition-colors"
                title={`Remove from ${currentPlaylist?.name || 'playlist'}`}
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Remove Confirmation Dialog */}
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fade-in">
            <div className="bg-slate-800 rounded-lg p-6 max-w-sm mx-4 border border-slate-700 shadow-xl animate-scale-in">
              <h3 className="text-lg font-semibold text-white mb-2">Remove Song?</h3>
              <p className="text-slate-300 mb-6">
                Remove "{currentSong?.title}" from {currentPlaylist?.name || 'this playlist'}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveSong}
                  disabled={removeSongFromPlaylist.isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {removeSongFromPlaylist.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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


      </div>
    </div>
  );
}
