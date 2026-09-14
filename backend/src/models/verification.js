const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },
    status: {
      type: String,
      enum: ["unverified", "pending", "verified", "failed"],
      default: "pending",
    },
    score: {
      type: Number,
      default: 0.0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: String,
      default: "Skillora AI Verification Engine",
    },
    adminDecision: {
      type: String,
      default: null,
    },
    profileCompletenessScore: {
      type: Number,
      default: 0.0,
    },
    technicalAssessmentScore: {
      type: Number,
      default: 0.0,
    },
    documentConsistencyScore: {
      type: Number,
      default: 0.0,
    },
    videoVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "verifications",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

verificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Verification", verificationSchema);
