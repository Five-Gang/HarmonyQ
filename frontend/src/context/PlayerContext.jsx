import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const pendingSeekRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0–100
  const [duration, setDuration] = useState(0);
  const [isSeekable, setIsSeekable] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullScreenPlayer, setShowFullScreenPlayer] = useState(false);

  const audio = audioRef.current;

  // Sync volume
  useEffect(() => {
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Wire up audio events
  useEffect(() => {
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      // Check if seekable after metadata is loaded
      setIsSeekable(audio.seekable.length > 0);
      // Apply any pending seek
      if (pendingSeekRef.current !== null && audio.seekable.length > 0) {
        const pct = pendingSeekRef.current;
        audio.currentTime = (pct / 100) * audio.duration;
        pendingSeekRef.current = null;
      }
    };
    const onSeeking = () => {
      // Mark as loading while seeking
      setIsLoading(true);
    };
    const onSeeked = () => {
      // Done seeking, clear loading state
      setIsLoading(false);
    };
    const onLoadStart = () => {
      setIsLoading(true);
      setIsSeekable(false);
    };
    const onCanPlay = () => {
      setIsLoading(false);
      // Audio can play, check if it's seekable
      setIsSeekable(audio.seekable.length > 0);
    };
    const onProgress = () => {
      // Update seekable status as more data loads
      if (audio.seekable.length > 0) {
        setIsSeekable(true);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onWaiting = () => setIsLoading(true);
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Could not load audio. Check that the song URL is valid.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('seeking', onSeeking);
    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('progress', onProgress);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('seeking', onSeeking);
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const playSong = useCallback((song) => {
    setError(null);
    if (!song.songUrl) {
      setError(`"${song.title}" has no audio file uploaded yet.`);
      return;
    }

    if (currentSong?._id === song._id) {
      // Toggle play/pause for the same song
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(() => setError('Playback failed.'));
      }
      return;
    }

    // New song
    audio.pause();
    audio.src = song.songUrl;
    audio.currentTime = 0;
    setCurrentSong(song);
    setProgress(0);
    setIsLoading(true);
    audio.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        setIsPlaying(false);
        setIsLoading(false);
        setError(`Playback error: ${err.message}`);
      });
  }, [currentSong, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true));
    }
  }, [isPlaying, currentSong]);

  const seek = useCallback((pct) => {
    // Normalize percentage
    const normalizedPct = Math.max(0, Math.min(100, pct));
    setProgress(normalizedPct);

    const dur = audio.duration || duration;
    
    // Only proceed if we have a valid duration
    if (!(dur > 0 && isFinite(dur))) {
      // Store as pending seek for when audio is ready
      pendingSeekRef.current = normalizedPct;
      return;
    }

    const targetTime = (normalizedPct / 100) * dur;

    // If audio is seekable, perform the seek immediately
    if (isSeekable || audio.seekable.length > 0) {
      try {
        audio.currentTime = targetTime;
        pendingSeekRef.current = null;
      } catch (err) {
        console.warn('Seek error:', err);
        // Store as pending and retry when seekable
        pendingSeekRef.current = normalizedPct;
      }
    } else {
      // Audio not seekable yet, store for later
      pendingSeekRef.current = normalizedPct;
      
      // Try a forced seek anyway as a fallback
      try {
        audio.currentTime = targetTime;
      } catch (err) {
        // Silent fail - will retry when seekable
      }
    }
  }, [duration, isSeekable]);

  const changeVolume = useCallback((val) => {
    setVolume(val);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const clearError = useCallback(() => setError(null), []);

  const toggleFullScreenPlayer = useCallback(() => {
    setShowFullScreenPlayer((prev) => !prev);
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, progress, duration, volume, isMuted,
      isLoading, error, showFullScreenPlayer, isSeekable,
      playSong, togglePlay, seek, changeVolume, toggleMute, clearError,
      toggleFullScreenPlayer,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
};
