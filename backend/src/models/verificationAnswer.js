const mongoose = require("mongoose");

const verificationAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VerificationQuestion",
      required: true,
    },
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    aiScore: {
      type: Number,
      default: 0.0,
    },
    aiFeedback: {
      type: String,
      default: null,
    },
    passed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "verification_answers",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

verificationAnswerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("VerificationAnswer", verificationAnswerSchema);
