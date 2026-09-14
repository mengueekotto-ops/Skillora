const fs = require("fs");
const path = require("path");
const { User, Professional, Service, VerificationDocument } = require("../models");

/**
 * Generic Image Upload Handler
 * POST /api/upload/image
 */
const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier image n'a été fourni ou le format est incorrect.",
      });
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const fullUrl = `${protocol}://${host}${req.uploadedFile.url}`;

    return res.status(201).json({
      success: true,
      message: "Image téléversée avec succès.",
      data: {
        filename: req.uploadedFile.filename,
        url: fullUrl,
        relativePath: req.uploadedFile.url,
        mimetype: req.uploadedFile.mimetype,
        size: req.uploadedFile.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Multiple Images (Portfolio / Gallery)
 * POST /api/upload/multiple
 */
const uploadMultipleImages = async (req, res, next) => {
  try {
    const files = req.uploadedFiles || (req.uploadedFile ? [req.uploadedFile] : []);

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier image n'a été téléversé.",
      });
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";

    const data = files.map((file) => ({
      filename: file.filename,
      url: `${protocol}://${host}${file.url}`,
      relativePath: file.url,
      mimetype: file.mimetype,
      size: file.size,
    }));

    return res.status(201).json({
      success: true,
      message: `${data.length} image(s) téléversée(s) avec succès.`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload and update User Profile Picture
 * POST /api/upload/profile-image
 */
const uploadProfileImage = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Identifiant utilisateur (userId) manquant.",
      });
    }

    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir une image valide.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé.",
      });
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const fullUrl = `${protocol}://${host}${req.uploadedFile.url}`;

    user.profileImage = fullUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Photo de profil mise à jour avec succès.",
      data: {
        userId: user._id,
        profileImage: fullUrl,
        relativePath: req.uploadedFile.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload and update Artisan Cover Photo
 * POST /api/upload/artisan-cover
 */
const uploadArtisanCover = async (req, res, next) => {
  try {
    const artisanId = req.body.artisanId || (req.user ? req.user._id : null);
    if (!artisanId) {
      return res.status(400).json({
        success: false,
        message: "artisanId ou utilisateur authentifié manquant.",
      });
    }

    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir une image valide.",
      });
    }

    let artisan = await Professional.findById(artisanId);
    if (!artisan) {
      artisan = await Professional.findOne({ userId: artisanId });
    }

    if (!artisan) {
      return res.status(404).json({
        success: false,
        message: "Profil artisan introuvable.",
      });
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const fullUrl = `${protocol}://${host}${req.uploadedFile.url}`;

    artisan.coverPhoto = fullUrl;
    await artisan.save();

    return res.status(200).json({
      success: true,
      message: "Photo de couverture de l'artisan mise à jour.",
      data: {
        artisanId: artisan._id,
        coverPhoto: fullUrl,
        relativePath: req.uploadedFile.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadProfileImage,
  uploadArtisanCover,
};
