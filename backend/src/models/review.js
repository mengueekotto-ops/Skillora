const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },

    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      default: null,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: null,
    },

    qualityRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },

    professionalismRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },

    communicationRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },

    punctualityRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },

    reliabilityRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
    collection: "reviews",
  }
);

module.exports = mongoose.model("Review", reviewSchema);