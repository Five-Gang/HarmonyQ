const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const logger = require('./logger');

const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'melodai-music';

let blobServiceClient;

try {
  if (!AZURE_CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set in environment variables.');
  }
  blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
  logger.info('Azure Blob Storage client initialized successfully.');
} catch (error) {
  logger.error('Failed to initialize Azure Blob Storage client:', error.message);
}

/**
 * Uploads a file buffer to Azure Blob Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalName - The original file name (used to extract extension)
 * @param {string} folder - The folder/prefix inside the container (e.g., 'songs')
 * @param {string} mimeType - The MIME type (e.g., 'audio/mpeg')
 * @returns {Promise<string>} - The public URL of the uploaded blob
 */
const uploadToAzure = async (fileBuffer, originalName, folder, mimeType) => {
  if (!blobServiceClient) {
    throw new Error('Azure Blob Storage client is not initialized. Check AZURE_STORAGE_CONNECTION_STRING.');
  }

  // Create a unique blob name
  const extension = path.extname(originalName);
  const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const blobName = `${folder}/${uniqueFileName}`;

  const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

  // Ensure container exists (create if not, with public blob access)
  await containerClient.createIfNotExists({ access: 'blob' });

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  logger.info(`Azure upload successful: ${blobName}`);

  // Return the public URL
  return blockBlobClient.url;
};

module.exports = {
  blobServiceClient,
  uploadToAzure,
};
