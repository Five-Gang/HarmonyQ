const userProfileService = require('../services/userProfileService');

class UserProfileController {
  async syncUser(req, res, next) {
    try {
      const { clerkUserId, email, displayName, avatar } = req.body;
      const profile = await userProfileService.syncUser({ clerkUserId, email, displayName, avatar });
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async getUserProfile(req, res, next) {
    try {
      // Allow user to access own profile or admin to access any
      const { clerkUserId } = req.params;
      if (req.auth.userId !== clerkUserId && !req.auth.roles.includes('admin')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
      }
      const profile = await userProfileService.getUserProfile(clerkUserId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      if (req.auth.userId !== clerkUserId && !req.auth.roles.includes('admin')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
      }
      const profile = await userProfileService.updatePreferences(clerkUserId, req.body.preferences);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      if (req.auth.userId !== clerkUserId && !req.auth.roles.includes('admin')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
      }
      const profile = await userProfileService.updateProfile(clerkUserId, req.body);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async getListeningHistory(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      if (req.auth.userId !== clerkUserId && !req.auth.roles.includes('admin')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
      }
      const { page, limit } = req.query;
      const result = await userProfileService.getListeningHistory(clerkUserId, { page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async addToHistory(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      if (req.auth.userId !== clerkUserId) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
      }
      const result = await userProfileService.addToHistory(clerkUserId, req.body);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // Internal endpoint for Recommendation Service
  async getUserPreferences(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      const data = await userProfileService.getUserPreferences(clerkUserId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserProfileController();
