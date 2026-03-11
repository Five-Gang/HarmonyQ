const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Playlist name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    clerkUserId: {
      type: String,
      required: [true, 'Owner user ID is required'],
      index: true,
    },
    coverImage: {
      type: String,
      default: null,
    },
    songIds: {
      type: [{ type: String }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 500,
        message: 'A playlist cannot have more than 500 songs',
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String, trim: true }],
    followerCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

playlistSchema.virtual('songCount').get(function () {
  return this.songIds.length;
});

playlistSchema.index({ clerkUserId: 1, isActive: 1 });
playlistSchema.index({ isPublic: 1, isActive: 1 });

const Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;
