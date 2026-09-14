const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "PROFESSIONAL", "ADMIN"],
      default: "CUSTOMER",
    },

    profileImage: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Explicit unique index on email
userSchema.index({ email: 1 }, { unique: true });

// Virtual id field
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("User", userSchema);