import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0–100
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Could not load audio. Check that the song URL is valid.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
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
    if (audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
      setProgress(pct);
    }
  }, []);

  const changeVolume = useCallback((val) => {
    setVolume(val);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, progress, duration, volume, isMuted,
      isLoading, error,
      playSong, togglePlay, seek, changeVolume, toggleMute, clearError,
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
