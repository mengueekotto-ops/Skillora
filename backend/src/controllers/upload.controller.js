const { resolveOwnedProfessional } = require("../utils/ownership.util");

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

const buildFileUrl = (req, relativeUrl) => {
  const host = req.get("host") || "localhost:5000";
  const protocol = req.protocol || "http";
  return `${protocol}://${host}${relativeUrl}`;
};

/**
 * Upload and update the logged-in user's profile picture
 * POST /api/upload/profile-image
 */
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir une image valide.",
      });
    }

    const fullUrl = buildFileUrl(req, req.uploadedFile.url);
    req.user.profileImage = fullUrl;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Photo de profil mise à jour avec succès.",
      data: {
        userId: req.user._id,
        profileImage: fullUrl,
        relativePath: req.uploadedFile.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload and update the logged-in artisan's cover photo (admins may pass artisanId)
 * POST /api/upload/artisan-cover
 */
const uploadArtisanCover = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir une image valide.",
      });
    }

    const owned = await resolveOwnedProfessional(req.user, req.body.artisanId);
    if (!owned.professional) {
      return res.status(owned.status).json({ success: false, message: owned.message });
    }

    const fullUrl = buildFileUrl(req, req.uploadedFile.url);
    owned.professional.coverPhoto = fullUrl;
    await owned.professional.save();

    return res.status(200).json({
      success: true,
      message: "Photo de couverture de l'artisan mise à jour.",
      data: {
        artisanId: owned.professional._id,
        coverPhoto: fullUrl,
        relativePath: req.uploadedFile.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload the logged-in artisan's presentation video
 * POST /api/upload/video
 */
const uploadArtisanVideo = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir une vidéo valide (WEBM, MP4 ou MOV).",
      });
    }

    const owned = await resolveOwnedProfessional(req.user, req.body.artisanId);
    if (!owned.professional) {
      return res.status(owned.status).json({ success: false, message: owned.message });
    }

    const fullUrl = buildFileUrl(req, req.uploadedFile.url);
    owned.professional.videoUrl = fullUrl;
    await owned.professional.save();

    return res.status(201).json({
      success: true,
      message: "Vidéo de présentation enregistrée.",
      data: {
        artisanId: owned.professional._id,
        url: fullUrl,
        relativePath: req.uploadedFile.url,
        size: req.uploadedFile.size,
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
  uploadArtisanVideo,
};
