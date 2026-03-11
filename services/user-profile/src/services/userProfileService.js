const UserProfile = require('../models/UserProfile');
const logger = require('../config/logger');

class UserProfileService {
  /**
   * Sync user profile from Clerk (create if not exists)
   */
  async syncUser({ clerkUserId, email, displayName, avatar }) {
    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId },
      {
        $setOnInsert: { clerkUserId, email, displayName: displayName || email.split('@')[0], avatar },
        $set: { lastActiveAt: new Date() },
      },
      { upsert: true, new: true, runValidators: true }
    );
    logger.info('User synced', { clerkUserId });
    return profile;
  }

  /**
   * Get user profile by Clerk ID
   */
  async getUserProfile(clerkUserId) {
    const profile = await UserProfile.findOne({ clerkUserId, isActive: true })
      .select('-listeningHistory')
      .lean();

    if (!profile) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      throw err;
    }

    return profile;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(clerkUserId, preferences) {
    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId, isActive: true },
      { $set: { preferences, lastActiveAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();

    if (!profile) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      throw err;
    }

    logger.info('User preferences updated', { clerkUserId });
    return profile;
  }

  /**
   * Update display name and bio
   */
  async updateProfile(clerkUserId, { displayName, bio, avatar }) {
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    updates.lastActiveAt = new Date();

    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId, isActive: true },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!profile) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      throw err;
    }

    return profile;
  }

  /**
   * Get listening history with pagination
   */
  async getListeningHistory(clerkUserId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const profile = await UserProfile.findOne({ clerkUserId, isActive: true })
      .select('listeningHistory totalListeningTime')
      .lean();

    if (!profile) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      throw err;
    }

    const total = profile.listeningHistory.length;
    const start = (pageNum - 1) * limitNum;
    const history = [...profile.listeningHistory]
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt))
      .slice(start, start + limitNum);

    return {
      history,
      totalListeningTime: profile.totalListeningTime,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Add a song to listening history
   */
  async addToHistory(clerkUserId, { songId, duration = 0 }) {
    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId, isActive: true },
      {
        $push: {
          listeningHistory: {
            $each: [{ songId, duration, playedAt: new Date() }],
            $position: 0,
            $slice: 500, // keep last 500 entries
          },
        },
        $inc: { totalListeningTime: duration },
        $set: { lastActiveAt: new Date() },
      },
      { new: true }
    );

    if (!profile) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      throw err;
    }

    return { message: 'History updated' };
  }

  /**
   * Get user preferences (used by Recommendation Service)
   */
  async getUserPreferences(clerkUserId) {
    const profile = await UserProfile.findOne({ clerkUserId, isActive: true })
      .select('preferences listeningHistory')
      .lean();

    if (!profile) return null;

    // Compute top listened genres from history (simplified)
    return {
      preferences: profile.preferences,
      recentSongIds: profile.listeningHistory
        .slice(0, 50)
        .map((h) => h.songId),
    };
  }
}

module.exports = new UserProfileService();
