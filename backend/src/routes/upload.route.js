const express = require("express");
const router = express.Router();
const { uploadImageMiddleware } = require("../middleware/upload.middleware");
const {
  uploadSingleImage,
  uploadMultipleImages,
  uploadProfileImage,
  uploadArtisanCover,
} = require("../controllers/upload.controller");

// Generic single image upload (from gallery or camera)
router.post("/image", uploadImageMiddleware, uploadSingleImage);

// Generic multiple images upload (portfolio gallery)
router.post("/multiple", uploadImageMiddleware, uploadMultipleImages);

// Dedicated profile picture upload & user update
router.post("/profile-image", uploadImageMiddleware, uploadProfileImage);

// Dedicated artisan cover photo upload & profile update
router.post("/artisan-cover", uploadImageMiddleware, uploadArtisanCover);

module.exports = router;
