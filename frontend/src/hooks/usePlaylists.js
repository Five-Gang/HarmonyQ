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
      toast.success('Playlist updated!');
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
