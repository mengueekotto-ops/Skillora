const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: null,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    location: {
      type: String,
      default: null,
    },

    image: {
      type: String,
      default: null,
    },

    gallery: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    collection: "services",
  }
);

module.exports = mongoose.model("Service", serviceSchema);