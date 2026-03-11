import { recommendationApi } from '../lib/apiClient';

export const recommendationService = {
  getRecommendations: (clerkUserId) => recommendationApi.get(`/${clerkUserId}`),
};
