const { Payment, Professional, Notification } = require("../models");
const digipayService = require("./digipay.service");

/**
 * Pay out one escrowed payment: 2% to the platform, 98% to the artisan.
 * The HELD → PROCESSING switch is atomic, so a payment can never be paid out twice.
 */
async function releasePayment(paymentId) {
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "HELD" },
    { status: "PROCESSING" },
    { returnDocument: "after" }
  );
  if (!payment) return null; // already released or not releasable

  try {
    const payouts = await digipayService.processSplitPayouts({
      totalAmount: payment.amount,
      artisanPhone: payment.artisanPhone,
    });

    payment.platformPayoutId = payouts.platformPayout?.payoutId || null;
    payment.artisanPayoutId = payouts.artisanPayout?.payoutId || null;
    payment.status = "SUCCESS";
    payment.releasedAt = new Date();
    await payment.save();

    if (payment.professionalId) {
      const prof = await Professional.findByIdAndUpdate(
        payment.professionalId,
        { $inc: { walletBalance: payment.artisanAmount } },
        { returnDocument: "after" }
      );
      if (prof) {
        await Notification.create({
          userId: prof.userId,
          title: "Payment Received 💰",
          message: `You have received ${payment.artisanAmount.toLocaleString()} FCFA (after the 2% platform fee).`,
          type: "PAYMENT",
        });
      }
    }

    return payment;
  } catch (error) {
    payment.status = "PAYOUT_FAILED";
    payment.failureReason = error.message;
    await payment.save();
    console.error(`❌ Payout failed for payment ${payment._id}:`, error.message);
    return payment;
  }
}

/** Release every escrowed payment of a service request (called when the job is COMPLETED). */
async function releaseHeldPaymentsForRequest(serviceRequestId) {
  const held = await Payment.find({ serviceRequestId, status: "HELD" }).select("_id");
  const results = [];
  for (const p of held) {
    results.push(await releasePayment(p._id));
  }
  return results.filter(Boolean);
}

/**
 * When a paid job is cancelled or rejected, escrowed money must go back to the customer.
 * DigiPay refunds are handled by an admin, so the payment is flagged for them.
 */
async function flagRefundsForRequest(serviceRequestId) {
  const result = await Payment.updateMany(
    { serviceRequestId, status: { $in: ["HELD", "PENDING"] } },
    [
      {
        $set: {
          status: { $cond: [{ $eq: ["$status", "HELD"] }, "REFUND_PENDING", "CANCELLED"] },
        },
      },
    ]
  );
  return result.modifiedCount || 0;
}

module.exports = {
  releasePayment,
  releaseHeldPaymentsForRequest,
  flagRefundsForRequest,
};
