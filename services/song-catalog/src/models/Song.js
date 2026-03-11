const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Song title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    artist: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
      maxlength: [200, 'Artist name cannot exceed 200 characters'],
      index: true,
    },
    album: {
      type: String,
      trim: true,
      maxlength: [200, 'Album name cannot exceed 200 characters'],
      default: 'Single',
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      enum: {
        values: [
          'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
          'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
          'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk',
          'Alternative', 'K-Pop', 'Other',
        ],
        message: '{VALUE} is not a supported genre',
      },
      index: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 second'],
      comment: 'Duration in seconds',
    },
    releaseYear: {
      type: Number,
      required: [true, 'Release year is required'],
      min: [1900, 'Release year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Release year cannot be in the future'],
    },
    coverArt: {
      type: String,
      default: null,
    },
    playCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String, trim: true }],
    metadata: {
      bpm: Number,
      key: String,
      mood: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for formatted duration (MM:SS)
songSchema.virtual('durationFormatted').get(function () {
  const mins = Math.floor(this.duration / 60);
  const secs = this.duration % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

// Text index for full-text search
songSchema.index({ title: 'text', artist: 'text', album: 'text' });

// Compound index for sorting
songSchema.index({ genre: 1, releaseYear: -1 });
songSchema.index({ artist: 1, title: 1 });

const Song = mongoose.model('Song', songSchema);
module.exports = Song;
