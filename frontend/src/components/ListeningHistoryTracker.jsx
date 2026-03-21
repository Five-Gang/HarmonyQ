import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { usePlayer } from '../context/PlayerContext';
import { useRecordListeningHistory } from '../hooks/useUser';

/**
 * ListeningHistoryTracker
 * Monitors the player and records listening history when songs complete.
 * Should be placed inside PlayerProvider to access player context.
 */
export function ListeningHistoryTracker({ children }) {
  const { user } = useUser();
  const { currentSong, duration, progress } = usePlayer();
  const recordMutation = useRecordListeningHistory();
  const lastRecordedSongRef = useRef(null);
  const hasListenedRef = useRef(false);

  useEffect(() => {
    // Record when a song has played for at least 30 seconds (minimum threshold)
    // and the user is moving to a different song
    if (!currentSong) {
      hasListenedRef.current = false;
      return;
    }

    // Check if we've listened enough (at least 30 seconds or 30% of song)
    const minimumListenTime = Math.max(30, duration * 0.3);
    const currentTimeSeconds = (progress / 100) * duration;
    
    // If we've listened for the minimum time and haven't recorded this song yet
    if (
      currentTimeSeconds >= minimumListenTime &&
      lastRecordedSongRef.current !== currentSong._id &&
      !hasListenedRef.current
    ) {
      hasListenedRef.current = true;
    }

    // When transitioning to a new song, record the previous one
    return () => {
      if (
        hasListenedRef.current &&
        lastRecordedSongRef.current !== currentSong._id &&
        user?.id &&
        currentSong._id
      ) {
        // Record the song that was just played
        lastRecordedSongRef.current = currentSong._id;
        recordMutation.mutate({
          clerkUserId: user.id,
          songId: currentSong._id,
          duration: Math.round(duration) || 0,
        });
        hasListenedRef.current = false;
      }
    };
  }, [currentSong?._id, duration, progress, user?.id, recordMutation]);

  return children;
}
