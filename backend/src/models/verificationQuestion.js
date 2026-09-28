const mongoose = require("mongoose");

const verificationQuestionSchema = new mongoose.Schema(
  {
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Verification",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    expectedAnswer: {
      type: String,
      default: null,
    },
    profession: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctOption: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,
    },
    explanation: {
      type: String,
      default: "",
    },
    weight: {
      type: Number,
      default: 33,
    },
  },
  {
    timestamps: true,
    collection: "verification_questions",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

verificationQuestionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("VerificationQuestion", verificationQuestionSchema);
