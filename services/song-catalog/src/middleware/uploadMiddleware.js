const multer = require('multer');

// Configure multer storage (memory storage for stream uploading)
const storage = multer.memoryStorage();

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Accepted MIME types
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and audio files are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // 50MB file size limit for audio files
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = {
  upload
};
