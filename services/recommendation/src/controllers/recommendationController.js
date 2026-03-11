const recommendationService = require('../services/recommendationService');

class RecommendationController {
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
}

module.exports = new RecommendationController();
