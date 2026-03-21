import { parseBlob } from 'music-metadata';

/**
 * Extract metadata from an audio file (MP3, WAV, OGG, etc.)
 * Uses music-metadata to parse tags and duration
 */
export const extractAudioMetadata = (audioFile) => {
  return new Promise((resolve) => {
    const metadata = {
      title: '',
      artist: '',
      album: '',
      duration: null,
      releaseYear: '',
    };

    // Set a timeout to resolve even if metadata parsing takes too long
    const timeoutId = setTimeout(() => {
      resolve(metadata);
    }, 5000);

    // Parse metadata from audio file using music-metadata
    parseBlob(audioFile)
      .then((meta) => {
        clearTimeout(timeoutId);

        if (meta.common) {
          const common = meta.common;
          if (common.title) metadata.title = common.title;
          if (common.artist) metadata.artist = common.artist;
          if (common.album) metadata.album = common.album;
          if (common.year) metadata.releaseYear = common.year.toString();
        }

        // Get duration from format info
        if (meta.format && meta.format.duration) {
          metadata.duration = Math.round(meta.format.duration);
        }

        resolve(metadata);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('Error parsing audio metadata:', err);
        // Fall back to getting duration from audio element
        const audio = new Audio();
        audio.onloadedmetadata = () => {
          if (audio.duration && isFinite(audio.duration)) {
            metadata.duration = Math.round(audio.duration);
          }
          URL.revokeObjectURL(objectUrl);
          resolve(metadata);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(metadata);
        };

        const objectUrl = URL.createObjectURL(audioFile);
        audio.src = objectUrl;
      });
  });
};
