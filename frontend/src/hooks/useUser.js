import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/userService';
import { recommendationService } from '../api/recommendationService';
import toast from 'react-hot-toast';

export const useUserProfile = (clerkUserId) =>
  useQuery({
    queryKey: ['profile', clerkUserId],
    queryFn: () => userService.getProfile(clerkUserId),
    enabled: !!clerkUserId,
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clerkUserId, data }) => userService.updateProfile(clerkUserId, data),
    onSuccess: (_, { clerkUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', clerkUserId] });
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clerkUserId, preferences }) => userService.updatePreferences(clerkUserId, preferences),
    onSuccess: (_, { clerkUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', clerkUserId] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      toast.success('Preferences saved!');
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useListeningHistory = (clerkUserId, params) =>
  useQuery({
    queryKey: ['history', clerkUserId, params],
    queryFn: () => userService.getHistory(clerkUserId, params),
    enabled: !!clerkUserId,
  });

export const useRecordListeningHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clerkUserId, songId, duration }) => userService.addToHistory(clerkUserId, { songId, duration }),
    onSuccess: (_, { clerkUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['history', clerkUserId] });
    },
    onError: (err) => console.error('Failed to record listening history:', err),
  });
};

export const useSyncUser = () =>
  useMutation({ mutationFn: userService.syncUser });

export const useRecommendations = (clerkUserId) =>
  useQuery({
    queryKey: ['recommendations', clerkUserId],
    queryFn: () => recommendationService.getRecommendations(clerkUserId),
    enabled: !!clerkUserId,
    staleTime: 1000 * 60 * 5,
  });

export const useTrendingSongs = (limit = 20) =>
  useQuery({
    queryKey: ['trending', limit],
    queryFn: () => recommendationService.getTrendingSongs(limit),
    staleTime: 1000 * 60 * 10,
  });

export const useRecommendationsByGenre = (clerkUserId, genres, limit = 20, enabled = true) =>
  useQuery({
    queryKey: ['recommendations-genre', clerkUserId, genres, limit],
    queryFn: () => recommendationService.getRecommendationsByGenre(clerkUserId, genres, limit),
    enabled: !!clerkUserId && enabled && !!genres?.length,
    staleTime: 1000 * 60 * 5,
  });

export const useSimilarSongs = (songId, limit = 10, enabled = true) =>
  useQuery({
    queryKey: ['similar-songs', songId, limit],
    queryFn: () => recommendationService.getSimilarSongs(songId, limit),
    enabled: !!songId && enabled,
    staleTime: 1000 * 60 * 10,
  });

export const useUserPreferences = (clerkUserId, enabled = true) =>
  useQuery({
    queryKey: ['user-preferences', clerkUserId],
    queryFn: () => recommendationService.getUserPreferences(clerkUserId),
    enabled: !!clerkUserId && enabled,
    staleTime: 1000 * 60 * 5,
  });
