const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Max file sizes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // images: 10MB
const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60-second presentation video: 60MB

// Allowed image MIME types and extensions.
// SVG is deliberately excluded: it can embed scripts and would be served from our own origin.
const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const ALLOWED_VIDEO_TYPES = {
  "video/webm": ".webm",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
};

/**
 * Parses multipart boundary from Content-Type header
 */
function getBoundary(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match ? (match[1] || match[2]).trim() : null;
}

/**
 * Handle multipart/form-data directly from request stream
 */
function parseMultipartBuffer(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
  const parts = [];

  let start = 0;
  while (start < buffer.length) {
    const boundaryIdx = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIdx === -1) break;

    const nextBoundaryIdx = buffer.indexOf(boundaryBuffer, boundaryIdx + boundaryBuffer.length);
    if (nextBoundaryIdx === -1) {
      const isEnd = buffer.indexOf(endBoundaryBuffer, boundaryIdx) === boundaryIdx;
      if (isEnd) break;
      break;
    }

    const partBuffer = buffer.slice(boundaryIdx + boundaryBuffer.length, nextBoundaryIdx);
    const headerEndIdx = partBuffer.indexOf(Buffer.from("\r\n\r\n"));

    if (headerEndIdx !== -1) {
      const headerStr = partBuffer.slice(0, headerEndIdx).toString("utf-8");
      let body = partBuffer.slice(headerEndIdx + 4);
      if (body.length >= 2 && body[body.length - 2] === 13 && body[body.length - 1] === 10) {
        body = body.slice(0, -2);
      }

      const nameMatch = headerStr.match(/name="([^"]+)"/i);
      const filenameMatch = headerStr.match(/filename="([^"]+)"/i);
      const typeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

      parts.push({
        name: nameMatch ? nameMatch[1] : null,
        filename: filenameMatch ? filenameMatch[1] : null,
        contentType: typeMatch ? typeMatch[1].trim().toLowerCase() : null,
        data: body,
      });
    }

    start = nextBoundaryIdx;
  }

  return parts;
}

/**
 * Express middleware for single and multiple image uploads
 */
const createUploadMiddleware = ({ allowedTypes, maxSize, prefix, typesLabel }) => (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  // 1. Check if request is base64 JSON upload
  if (contentType.includes("application/json") && req.body && (req.body.image || req.body.fileData || req.body.base64)) {
    const base64String = req.body.image || req.body.fileData || req.body.base64;
    try {
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let buffer;

      if (matches && matches.length === 3) {
        mimeType = matches[1].toLowerCase();
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(base64String, "base64");
      }

      if (!allowedTypes[mimeType]) {
        return res.status(400).json({
          success: false,
          message: `Format de fichier non valide. Formats acceptés : ${typesLabel}.`,
        });
      }

      if (buffer.length > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Le fichier dépasse la limite autorisée de ${Math.round(maxSize / 1024 / 1024)} Mo.`,
        });
      }

      const ext = allowedTypes[mimeType] || ".jpg";
      const filename = `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filepath, buffer);

      req.uploadedFile = {
        filename,
        filepath,
        url: `/uploads/${filename}`,
        mimetype: mimeType,
        size: buffer.length,
      };

      return next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Erreur lors du décodage de l'image Base64.",
        error: err.message,
      });
    }
  }

  // 2. Check if request is multipart/form-data
  if (contentType.includes("multipart/form-data")) {
    const boundary = getBoundary(contentType);
    if (!boundary) {
      return res.status(400).json({
        success: false,
        message: "En-tête multipart/form-data invalide (boundary introuvable).",
      });
    }

    const chunks = [];
    let totalSize = 0;
    let tooLarge = false;

    req.on("data", (chunk) => {
      if (tooLarge) return;
      totalSize += chunk.length;
      if (totalSize > maxSize + 1024 * 1024) {
        tooLarge = true;
        chunks.length = 0;
        res.status(413).json({
          success: false,
          message: `Le fichier dépasse la taille maximale autorisée de ${Math.round(maxSize / 1024 / 1024)} Mo.`,
        });
      } else {
        chunks.push(chunk);
      }
    });

    req.on("end", () => {
      if (tooLarge) return;
      try {
        const fullBuffer = Buffer.concat(chunks);
        const parts = parseMultipartBuffer(fullBuffer, boundary);

        req.body = req.body || {};
        req.uploadedFiles = [];

        for (const part of parts) {
          if (part.filename) {
            // Browsers may append codec info, e.g. "video/webm;codecs=vp9"
            const mime = (part.contentType || "").split(";")[0].trim();
            if (!allowedTypes[mime]) {
              return res.status(400).json({
                success: false,
                message: `Le fichier ${part.filename} n'est pas valide. Formats autorisés : ${typesLabel}.`,
              });
            }

            if (part.data.length > maxSize) {
              return res.status(400).json({
                success: false,
                message: `Le fichier ${part.filename} dépasse la taille maximale autorisée de ${Math.round(maxSize / 1024 / 1024)} Mo.`,
              });
            }

            const ext = allowedTypes[mime];
            const filename = `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            fs.writeFileSync(filepath, part.data);

            const fileObj = {
              fieldname: part.name,
              originalname: part.filename,
              filename,
              filepath,
              url: `/uploads/${filename}`,
              mimetype: mime,
              size: part.data.length,
            };

            req.uploadedFiles.push(fileObj);
            if (!req.uploadedFile) {
              req.uploadedFile = fileObj;
            }
          } else if (part.name) {
            req.body[part.name] = part.data.toString("utf-8");
          }
        }

        return next();
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors du traitement du fichier téléversé.",
          error: err.message,
        });
      }
    });

    req.on("error", (err) => {
      return res.status(400).json({
        success: false,
        message: "Erreur de transmission du flux multipart.",
        error: err.message,
      });
    });

    return;
  }

  // Next if no file is present
  return next();
};

const uploadImageMiddleware = createUploadMiddleware({
  allowedTypes: ALLOWED_MIME_TYPES,
  maxSize: MAX_FILE_SIZE,
  prefix: "img",
  typesLabel: "JPEG, PNG, WEBP, GIF",
});

const uploadVideoMiddleware = createUploadMiddleware({
  allowedTypes: ALLOWED_VIDEO_TYPES,
  maxSize: MAX_VIDEO_SIZE,
  prefix: "vid",
  typesLabel: "WEBM, MP4, MOV",
});

module.exports = {
  uploadImageMiddleware,
  uploadVideoMiddleware,
  UPLOAD_DIR,
  ALLOWED_MIME_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE,
  MAX_VIDEO_SIZE,
};
