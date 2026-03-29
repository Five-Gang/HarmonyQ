import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistService } from '../api/playlistService';
import toast from 'react-hot-toast';

export const useUserPlaylists = (clerkUserId, params) =>
  useQuery({
    queryKey: ['playlists', 'user', clerkUserId, params],
    queryFn: () => playlistService.getUserPlaylists(clerkUserId, params),
    enabled: !!clerkUserId,
  });

export const usePlaylist = (id) =>
  useQuery({
    queryKey: ['playlists', id],
    queryFn: () => playlistService.getPlaylist(id),
    enabled: !!id,
  });

export const usePublicPlaylists = (params) =>
  useQuery({
    queryKey: ['playlists', 'public', params],
    queryFn: () => playlistService.getPublicPlaylists(params),
    staleTime: 1000 * 60 * 5,
  });

export const useFollowingPlaylists = (params) =>
  useQuery({
    queryKey: ['playlists', 'following', params],
    queryFn: () => playlistService.getFollowingPlaylists(params),
    staleTime: 1000 * 60 * 5,
  });

export const useAdminPlaylists = (params) =>
  useQuery({
    queryKey: ['playlists', 'admin', params],
    queryFn: () => playlistService.getAllPlaylistsAdmin(params),
    staleTime: 1000 * 30, // Re-fetch every 30 seconds for admin views
  });

export const useSetPlaylistStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => playlistService.setPlaylistStatus(id, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', id] });
      toast.success(
        data.isActive !== undefined
          ? (data.isActive ? 'Playlist activated' : 'Playlist deactivated')
          : (data.isPublic ? 'Playlist is now public' : 'Playlist is now private')
      );
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: playlistService.createPlaylist,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist created!');
      return data;
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useUpdatePlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => playlistService.updatePlaylist(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', id] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'public'] });
      toast.success('Playlist updated!');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useTogglePlaylistVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }) => playlistService.updatePlaylist(id, { isPublic }),
    onSuccess: (data, { id, isPublic }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', id] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'public'] });
      toast.success(isPublic ? 'Playlist is now public!' : 'Playlist is now private!');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: playlistService.deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useAddSongsToPlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, songIds }) => playlistService.addSongs(id, songIds),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', id] });
      toast.success('Songs added to playlist!');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useRemoveSongFromPlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }) => playlistService.removeSong(playlistId, songId),
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', playlistId] });
      toast.success('Song removed from playlist');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useReorderSongs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songIds }) => playlistService.reorderSongs(playlistId, songIds),
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', playlistId] });
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useDuplicatePlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playlistId, playlist }) => {
      // Create new playlist with "Copy of" prefix
      const newName = `Copy of ${playlist.name}`;
      const newPlaylist = await playlistService.createPlaylist({
        name: newName,
        description: playlist.description,
        isPublic: false, // Duplicated playlists are always private
      });
      
      // If original has songs, add them to the new playlist
      if (playlist.songIds && playlist.songIds.length > 0) {
        await playlistService.addSongs(newPlaylist.data._id, playlist.songIds);
      }
      
      return newPlaylist;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist duplicated!');
      return data;
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useFollowPlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId) => playlistService.followPlaylist(playlistId),
    onMutate: (playlistId) => {
      // Optimistically update all playlist queries
      queryClient.setQueriesData(
        { queryKey: ['playlists'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            playlists: old.playlists?.map(p =>
              p._id === playlistId ? { ...p, isFollowing: true, followerCount: (p.followerCount || 0) + 1 } : p
            ),
          };
        }
      );
    },
    onSuccess: (_, playlistId) => {
      // Invalidate relevant queries to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['playlists', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'following'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'admin'] });
      toast.success('Playlist followed!');
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.error(err.response?.data?.message || err.message);
    },
  });
};

export const useUnfollowPlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId) => playlistService.unfollowPlaylist(playlistId),
    onMutate: (playlistId) => {
      // Optimistically update all playlist queries
      queryClient.setQueriesData(
        { queryKey: ['playlists'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            playlists: old.playlists?.map(p =>
              p._id === playlistId ? { ...p, isFollowing: false, followerCount: Math.max(0, (p.followerCount || 1) - 1) } : p
            ),
          };
        }
      );
    },
    onSuccess: (_, playlistId) => {
      // Invalidate relevant queries to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['playlists', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'following'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'admin'] });
      toast.success('Playlist unfollowed');
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.error(err.response?.data?.message || err.message);
    },
  });
};

export const useDeletePlaylistAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId) => playlistService.deletePlaylistAdmin(playlistId),
    onSuccess: (_, playlistId) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'admin'] });
      toast.success('Playlist permanently deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });
};
