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
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const [repeatMode, setRepeatMode] = useState('REPEAT_INFINITE'); // STOP | REPEAT_ONCE | REPEAT_INFINITE

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

      // If in repeat once mode, replay the same song
      if (repeatMode === 'REPEAT_ONCE' && queue.length > 0) {
        const currentSong = queue[currentIndex];
        audio.src = currentSong.songUrl;
        audio.currentTime = 0;
        setProgress(0);
        setIsLoading(true);
        audio.play().catch(err => {
          setError(`Playback error: ${err.message}`);
        });
        return;
      }

      // If in stop mode and at end of queue, just stop
      if (repeatMode === 'STOP' && queue.length > 0 && currentIndex === queue.length - 1) {
        return;
      }

      // REPEAT_INFINITE mode: continue to next song or loop
      if (queue.length > 0 && currentIndex < queue.length - 1) {
        const nextSong = queue[currentIndex + 1];
        setCurrentIndex(currentIndex + 1);
        // Delay to allow state update
        setTimeout(() => {
          audio.src = nextSong.songUrl;
          audio.currentTime = 0;
          setCurrentSong(nextSong);
          setProgress(0);
          setIsLoading(true);
          audio.play().catch(err => {
            setError(`Playback error: ${err.message}`);
          });
        }, 0);
      } else if (queue.length > 0 && repeatMode === 'REPEAT_INFINITE') {
        // Loop back to beginning
        setCurrentIndex(0);
        const firstSong = queue[0];
        audio.src = firstSong.songUrl;
        audio.currentTime = 0;
        setCurrentSong(firstSong);
        setProgress(0);
        setIsLoading(true);
        audio.play().catch(err => {
          setError(`Playback error: ${err.message}`);
        });
      }
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
  }, [queue, currentIndex, repeatMode]);

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

  const closePlayer = useCallback(() => {
    // Pause playback and clear the current song to hide the player
    audio.pause();
    setIsPlaying(false);
    setCurrentSong(null);
    setShowFullScreenPlayer(false);
  }, []);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode((current) => {
      if (current === 'REPEAT_INFINITE') return 'REPEAT_ONCE';
      if (current === 'REPEAT_ONCE') return 'STOP';
      return 'REPEAT_INFINITE';
    });
  }, []);

  const playPlaylist = useCallback((songs, playlistId = null) => {
    if (!songs || songs.length === 0) {
      setError('No songs to play');
      return;
    }

    // Filter out songs without URLs
    const validSongs = songs.filter(song => song.songUrl);
    
    if (validSongs.length === 0) {
      setError('No playable songs in this playlist');
      return;
    }

    setQueue(validSongs);
    setCurrentIndex(0);
    setCurrentPlaylistId(playlistId);
    
    // Play the first song
    const firstSong = validSongs[0];
    setError(null);
    audio.pause();
    audio.src = firstSong.songUrl;
    audio.currentTime = 0;
    setCurrentSong(firstSong);
    setProgress(0);
    setIsLoading(true);
    audio.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        setIsPlaying(false);
        setIsLoading(false);
        setError(`Playback error: ${err.message}`);
      });
  }, []);

  const playNext = useCallback(async () => {
    // If in queue mode (playlist playing)
    if (queue.length > 0 && currentIndex < queue.length - 1) {
      const nextSong = queue[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      
      audio.pause();
      audio.src = nextSong.songUrl;
      audio.currentTime = 0;
      setCurrentSong(nextSong);
      setProgress(0);
      setIsLoading(true);
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setError(`Playback error: ${err.message}`);
        });
    } else if (queue.length > 0 && currentIndex === queue.length - 1) {
      // At end of playlist, loop to beginning
      setCurrentIndex(0);
      const firstSong = queue[0];
      
      audio.pause();
      audio.src = firstSong.songUrl;
      audio.currentTime = 0;
      setCurrentSong(firstSong);
      setProgress(0);
      setIsLoading(true);
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setError(`Playback error: ${err.message}`);
        });
    } else {
      // Playing single song - fetch and play random song
      try {
        const response = await fetch('/api/songs?limit=1&skip=' + Math.floor(Math.random() * 100));
        const data = await response.json();
        const randomSong = data.songs?.[0];
        
        if (randomSong && randomSong.songUrl) {
          audio.pause();
          audio.src = randomSong.songUrl;
          audio.currentTime = 0;
          setCurrentSong(randomSong);
          setProgress(0);
          setIsLoading(true);
          setQueue([]); // Clear queue to stay in single-song mode
          
          audio.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              setError(`Playback error: ${err.message}`);
            });
        }
      } catch (err) {
        setError('Failed to load next song');
      }
    }
  }, [queue, currentIndex]);

  const playPrevious = useCallback(async () => {
    // If in queue mode (playlist playing)
    if (queue.length > 0 && currentIndex > 0) {
      const prevSong = queue[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      
      audio.pause();
      audio.src = prevSong.songUrl;
      audio.currentTime = 0;
      setCurrentSong(prevSong);
      setProgress(0);
      setIsLoading(true);
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setError(`Playback error: ${err.message}`);
        });
    } else if (queue.length > 0 && currentIndex === 0) {
      // At start of playlist, loop to end
      const lastIndex = queue.length - 1;
      setCurrentIndex(lastIndex);
      const lastSong = queue[lastIndex];
      
      audio.pause();
      audio.src = lastSong.songUrl;
      audio.currentTime = 0;
      setCurrentSong(lastSong);
      setProgress(0);
      setIsLoading(true);
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setError(`Playback error: ${err.message}`);
        });
    } else {
      // Playing single song - fetch and play random song
      try {
        const response = await fetch('/api/songs?limit=1&skip=' + Math.floor(Math.random() * 100));
        const data = await response.json();
        const randomSong = data.songs?.[0];
        
        if (randomSong && randomSong.songUrl) {
          audio.pause();
          audio.src = randomSong.songUrl;
          audio.currentTime = 0;
          setCurrentSong(randomSong);
          setProgress(0);
          setIsLoading(true);
          setQueue([]); // Clear queue to stay in single-song mode
          
          audio.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              setError(`Playback error: ${err.message}`);
            });
        }
      } catch (err) {
        setError('Failed to load previous song');
      }
    }
  }, [queue, currentIndex]);

  const addToQueue = useCallback((songs, playlistId = null) => {
    if (!songs || songs.length === 0) return;
    
    // Filter songs with URLs
    const validSongs = songs.filter(song => song.songUrl);
    if (validSongs.length === 0) return;
    
    // Add to queue
    setQueue(prev => [...prev, ...validSongs]);
    
    // Update playlist ID if provided and no queue was playing
    if (playlistId && queue.length === 0) {
      setCurrentPlaylistId(playlistId);
    }
  }, [queue.length]);

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, progress, duration, volume, isMuted,
      isLoading, error, showFullScreenPlayer, isSeekable,
      queue, currentIndex, currentPlaylistId, repeatMode,
      playSong, togglePlay, seek, changeVolume, toggleMute, clearError,
      toggleFullScreenPlayer, closePlayer, playPlaylist, playNext, playPrevious, addToQueue, toggleRepeatMode,
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
