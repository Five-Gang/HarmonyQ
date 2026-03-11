const mongoose = require('mongoose');

const VALID_GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
  'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
  'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk',
  'Alternative', 'K-Pop', 'Other',
];

const listeningHistorySchema = new mongoose.Schema({
  songId: { type: String, required: true },
  playedAt: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 }, // seconds listened
}, { _id: false });

const userProfileSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: [true, 'Clerk user ID is required'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    preferences: {
      favoriteGenres: {
        type: [{ type: String, enum: VALID_GENRES }],
        default: [],
      },
      favoriteArtists: {
        type: [{ type: String, trim: true }],
        default: [],
      },
      isPublicProfile: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    },
    listeningHistory: {
      type: [listeningHistorySchema],
      default: [],
    },
    totalListeningTime: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userProfileSchema.virtual('listeningHistoryCount').get(function () {
  return this.listeningHistory.length;
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
module.exports = UserProfile;
