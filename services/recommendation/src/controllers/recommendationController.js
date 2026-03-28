const recommendationService = require('../services/recommendationService');

class RecommendationController {
  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      if (req.auth.userId !== clerkUserId && !req.auth.roles.includes('admin')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
      }

      const authToken = req.headers.authorization?.split(' ')[1];
      const result = await recommendationService.getRecommendations(clerkUserId, authToken);

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trending songs for discovery
   */
  async getTrendingSongs(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const authToken = req.headers.authorization?.split(' ')[1];
      
      const result = await recommendationService.getTrendingSongs(limit, authToken);
      res.status(200).json({ success: true, data: result, message: 'Trending songs fetched' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recommendations filtered by genres
   */
  async getRecommendationsByGenre(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      const { genres, limit = 20 } = req.query;

      if (!genres) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'Genres parameter is required' });
      }

      const genreArray = Array.isArray(genres) ? genres : [genres];
      const authToken = req.headers.authorization?.split(' ')[1];
      
      const result = await recommendationService.getRecommendationsByGenre(clerkUserId, genreArray, limit, authToken);
      res.status(200).json({ success: true, data: result, message: 'Genre recommendations fetched' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get songs similar to a specific song
   */
  async getSimilarSongs(req, res, next) {
    try {
      const { songId } = req.params;
      const { limit = 10 } = req.query;
      const authToken = req.headers.authorization?.split(' ')[1];

      const result = await recommendationService.getSimilarSongs(songId, limit, authToken);
      res.status(200).json({ success: true, data: result, message: 'Similar songs fetched' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's preference info that affects recommendations
   */
  async getUserPreferences(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      if (req.auth.userId !== clerkUserId && !req.auth.roles.includes('admin')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
      }

      const authToken = req.headers.authorization?.split(' ')[1];
      const result = await recommendationService.getUserPreferences(clerkUserId, authToken);

      res.status(200).json({ success: true, data: result, message: 'User preferences fetched' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecommendationController();
