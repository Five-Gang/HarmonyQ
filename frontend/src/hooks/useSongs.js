import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { songService } from '../api/songService';
import toast from 'react-hot-toast';

export const useSongs = (params) =>
  useQuery({
    queryKey: ['songs', params],
    queryFn: () => songService.getSongs(params),
    keepPreviousData: true,
  });

export const useSong = (id) =>
  useQuery({
    queryKey: ['songs', id],
    queryFn: () => songService.getSongById(id),
    enabled: !!id,
  });

export const useTrendingSongs = (limit) =>
  useQuery({
    queryKey: ['songs', 'trending', limit],
    queryFn: () => songService.getTrending(limit),
    staleTime: 1000 * 60 * 2,
  });

export const useCreateSong = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: songService.createSong,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song added successfully!');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useUpdateSong = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ songId, data }) => songService.updateSong(songId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song updated successfully!');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useDeleteSong = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: songService.deleteSong,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song deleted');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useIncrementPlay = () =>
  useMutation({ mutationFn: songService.incrementPlay });
