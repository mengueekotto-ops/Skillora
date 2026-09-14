const mongoose = require("mongoose");

const professionalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    artisanType: {
      type: String,
      enum: ["SINGLE", "GROUPED"],
      default: "SINGLE",
    },

    groupName: {
      type: String,
      default: null,
    },

    groupSize: {
      type: Number,
      default: 1,
    },

    groupRegNum: {
      type: String,
      default: null,
    },

    leadName: {
      type: String,
      default: null,
    },

    profession: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      default: null,
    },

    experience: {
      type: Number,
      default: 0,
    },

    skills: {
      type: [String],
      default: [],
    },

    education: {
      type: String,
      default: null,
    },

    certifications: {
      type: [String],
      default: [],
    },

    cvUrl: {
      type: String,
      default: null,
    },

    videoUrl: {
      type: String,
      default: null,
    },

    coverPhoto: {
      type: String,
      default: null,
    },

    portfolio: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // Optional verification status
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "failed"],
      default: "unverified",
    },

    verificationDate: {
      type: Date,
      default: null,
    },

    verificationScore: {
      type: Number,
      default: 0,
    },

    verifiedBadge: {
      type: Boolean,
      default: false,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
    },

    completedMissions: {
      type: Number,
      default: 0,
    },

    walletBalance: {
      type: Number,
      default: 350000, // FCFA
    },

    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },

      schedule: {
        type: String,
        default: "Mon-Fri 8:00 - 18:00",
      },
    },
  },
  {
    timestamps: true,
    collection: "professionals",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

professionalSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Professional", professionalSchema);