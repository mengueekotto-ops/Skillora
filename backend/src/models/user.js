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
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    // Never returned by queries unless explicitly requested with .select("+password")
    password: {
      type: String,
      required: true,
      select: false,
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

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Stored as a SHA-256 hash; hidden from every query by default
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },

    resetPasswordAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.resetPasswordAttempts;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);


// Virtual id field
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("User", userSchema);