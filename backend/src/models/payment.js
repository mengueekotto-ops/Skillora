const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      default: null,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },

    platformFee: {
      type: Number,
      required: true,
      description: "2% platform commission fee",
    },

    artisanAmount: {
      type: Number,
      required: true,
      description: "98% payout to artisan",
    },

    platformNumber: {
      type: String,
      default: "690191238",
      description: "Orange Money number receiving the 2% fee",
    },

    customerPhone: {
      type: String,
      required: true,
    },

    customerEmail: {
      type: String,
      default: "",
    },

    artisanPhone: {
      type: String,
      default: "",
    },

    paymentMethod: {
      type: String,
      enum: ["DIGIPAY", "MTN", "ORANGE"],
      default: "DIGIPAY",
    },

    payinTransactionId: {
      type: String,
      required: true,
    },

    platformPayoutId: {
      type: String,
      default: null,
    },

    artisanPayoutId: {
      type: String,
      default: null,
    },

    // PENDING        → Mobile Money push sent, waiting for the customer to approve
    // HELD           → money collected, held in escrow until the job is completed
    // PROCESSING     → payouts to artisan and platform in progress
    // SUCCESS        → payouts done
    // PAYOUT_FAILED  → money collected but a payout failed; needs admin action
    // REFUND_PENDING → job cancelled after payment; customer must be refunded
    status: {
      type: String,
      enum: ["PENDING", "HELD", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "PAYOUT_FAILED", "REFUND_PENDING"],
      default: "PENDING",
    },

    releasedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

paymentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Payment", paymentSchema);
