const mongoose = require("mongoose");

const verificationDocumentSchema = new mongoose.Schema(
  {
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Verification",
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        "ID_CARD",
        "PASSPORT",
        "CV",
        "CERTIFICATE",
        "PORTFOLIO",
        "BUSINESS_REGISTRATION",
        "VIDEO",
      ],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    aiResult: {
      type: mongoose.Schema.Types.Mixed,
      default: { consistencyScore: 90, flags: [] },
    },
    reviewStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "FLAGGED_FOR_ADMIN", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
    collection: "verification_documents",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

verificationDocumentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("VerificationDocument", verificationDocumentSchema);
