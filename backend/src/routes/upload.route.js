const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth.middleware");
const { uploadImageMiddleware, uploadVideoMiddleware } = require("../middleware/upload.middleware");
const {
  uploadSingleImage,
  uploadMultipleImages,
  uploadProfileImage,
  uploadArtisanCover,
  uploadArtisanVideo,
} = require("../controllers/upload.controller");

// Only logged-in users can store files on the server
router.use(authenticateToken);

// Generic single image upload (from gallery or camera)
router.post("/image", uploadImageMiddleware, uploadSingleImage);

// Generic multiple images upload (portfolio gallery)
router.post("/multiple", uploadImageMiddleware, uploadMultipleImages);

// Profile picture of the logged-in user
router.post("/profile-image", uploadImageMiddleware, uploadProfileImage);

// Cover photo of the logged-in artisan
router.post("/artisan-cover", uploadImageMiddleware, uploadArtisanCover);

// Presentation video of the logged-in artisan
router.post("/video", uploadVideoMiddleware, uploadArtisanVideo);

module.exports = router;
