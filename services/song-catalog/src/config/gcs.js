const { Storage } = require('@google-cloud/storage');
const path = require('path');
const logger = require('./logger');

// We expect a service account key file to be referenced by an environment variable, 
// or for GCP default credentials to be set up.
// Alternatively, if passed directly in development:
let storage;

try {
  // If GOOGLE_APPLICATION_CREDENTIALS is set in .env, @google-cloud/storage will automatically pick it up.
  // Otherwise, you can pass a keyFilename explicitly if you put the JSON file in your project.
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    // keyFilename: path.join(__dirname, '../../gcp-service-account.json') // Optional fallback
  });
} catch (error) {
  logger.error('Failed to initialize Google Cloud Storage client:', error.message);
}

const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'melodai-music-bucket';

/**
 * Uploads a file buffer to Google Cloud Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalName - The original file name (used to extract extension)
 * @param {string} folder - The folder prefix (e.g., 'songs')
 * @param {string} mimeType - The MIME type (e.g., 'audio/mpeg')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadToGCS = (fileBuffer, originalName, folder, mimeType) => {
  return new Promise((resolve, reject) => {
    if (!storage) {
      return reject(new Error('Google Cloud Storage client is not initialized'));
    }

    const bucket = storage.bucket(GCS_BUCKET_NAME);
    
    // Create a unique filename
    const extension = path.extname(originalName);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
    const destinationPath = `${folder}/${uniqueFileName}`;

    const blob = bucket.file(destinationPath);
    
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: mimeType,
      },
    });

    blobStream.on('error', (err) => {
      logger.error(`GCS upload failed: ${err.message}`);
      reject(err);
    });

    blobStream.on('finish', () => {
      // Create the public URL
      // (Requires the bucket to be configured for public read access, or you generate a signed URL)
      const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${destinationPath}`;
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
};

module.exports = {
  storage,
  uploadToGCS,
};
