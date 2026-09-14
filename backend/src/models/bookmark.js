const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "bookmarks",
  }
);

module.exports = mongoose.model("Bookmark", bookmarkSchema);