const { Payment, ServiceRequest, Professional, Notification } = require("../models");
const digipayService = require("../services/digipay.service");
const { toInternationalPhone } = digipayService;
const { releaseHeldPaymentsForRequest } = require("../services/payment.service");
const { isAdmin, isSameId } = require("../utils/ownership.util");

const MIN_AMOUNT = 100; // FCFA
const PAYABLE_REQUEST_STATUSES = ["ACCEPTED", "IN_PROGRESS", "COMPLETED"];
const PAID_STATUSES = ["SUCCESS", "COMPLETED", "SUCCESSFUL", "PAID"];
const FAILED_STATUSES = ["FAILED", "CANCELLED", "REJECTED", "EXPIRED", "DECLINED", "REFUNDED"];

/**
 * Fee estimate (2% platform fee, 98% to the artisan)
 * GET|POST /api/payments/estimate?amount=
 */
const getFeeEstimate = async (req, res, next) => {
  try {
    const amount = Number(req.query.amount || (req.body || {}).amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please specify a valid payment amount in FCFA.",
      });
    }

    return res.json({
      success: true,
      data: digipayService.calculateFeeBreakdown(amount),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 1. Customer starts a Mobile Money payment for one of their accepted service requests.
 * POST /api/payments/initiate   Body: { serviceRequestId, amount, customerPhone?, paymentMethod? }
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { serviceRequestId, amount, customerPhone, paymentMethod } = req.body || {};
    const numericAmount = Math.round(Number(amount));

    if (!serviceRequestId) {
      return res.status(400).json({
        success: false,
        message: "serviceRequestId is required. Payments are always linked to a booked job.",
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount < MIN_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `A valid payment amount of at least ${MIN_AMOUNT} FCFA is required.`,
      });
    }

    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest || !isSameId(serviceRequest.customerId, req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    if (!PAYABLE_REQUEST_STATUSES.includes(serviceRequest.status)) {
      return res.status(400).json({
        success: false,
        message: "This job can be paid once the artisan has accepted it.",
      });
    }

    const openPayment = await Payment.findOne({
      serviceRequestId: serviceRequest._id,
      status: { $in: ["PENDING", "HELD", "PROCESSING", "SUCCESS"] },
    });
    if (openPayment) {
      return res.status(409).json({
        success: false,
        message:
          openPayment.status === "PENDING"
            ? "A payment for this job is already waiting for your Mobile Money confirmation."
            : "This job has already been paid.",
        data: { payment: openPayment },
      });
    }

    let phoneToUse;
    try {
      phoneToUse = toInternationalPhone(customerPhone || req.user.phone);
    } catch {
      return res.status(400).json({
        success: false,
        message: "A valid Mobile Money phone number is required.",
      });
    }

    const professional = await Professional.findById(serviceRequest.professionalId).populate("userId", "phone");
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "The artisan for this job no longer exists.",
      });
    }

    const breakdown = digipayService.calculateFeeBreakdown(numericAmount);

    const payin = await digipayService.initiatePayIn({
      amount: breakdown.totalAmount,
      customerPhone: phoneToUse,
      customerEmail: req.user.email,
      metadata: { serviceRequestId: serviceRequest._id.toString() },
    });

    const payment = await Payment.create({
      serviceRequestId: serviceRequest._id,
      customerId: req.user._id,
      professionalId: professional._id,
      amount: breakdown.totalAmount,
      platformFee: breakdown.platformFee,
      artisanAmount: breakdown.artisanAmount,
      platformNumber: breakdown.platformOrangeNumber,
      customerPhone: phoneToUse,
      customerEmail: req.user.email,
      artisanPhone: professional.userId?.phone || "",
      paymentMethod: ["MTN", "ORANGE", "DIGIPAY"].includes(paymentMethod) ? paymentMethod : "DIGIPAY",
      payinTransactionId: payin.transactionId,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Mobile Money request sent. Approve it on your phone, then confirm the payment.",
      data: { payment, breakdown },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Check the Mobile Money transaction. If it was paid, the money is held in escrow
 *    until the customer confirms the job is COMPLETED; then it is paid out automatically.
 * POST /api/payments/confirm   Body: { paymentId } or { transactionId }
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, transactionId } = req.body || {};

    let payment = null;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else if (transactionId) {
      payment = await Payment.findOne({ payinTransactionId: transactionId });
    }

    if (!payment || (!isAdmin(req.user) && !isSameId(payment.customerId, req.user._id))) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found.",
      });
    }

    if (payment.status !== "PENDING") {
      return res.json({
        success: true,
        message: `Payment is already ${payment.status}.`,
        data: { payment },
      });
    }

    const txn = await digipayService.getTransactionStatus(payment.payinTransactionId);
    const txnStatus = String(txn?.status || "").toUpperCase();

    // Still waiting for the customer to approve on their phone: nothing is paid out yet.
    if (!PAID_STATUSES.includes(txnStatus) && !FAILED_STATUSES.includes(txnStatus)) {
      return res.status(202).json({
        success: true,
        pending: true,
        message: "Payment not received yet. Approve the Mobile Money request on your phone, then try again.",
        data: { payment },
      });
    }

    if (FAILED_STATUSES.includes(txnStatus)) {
      payment = await Payment.findOneAndUpdate(
        { _id: payment._id, status: "PENDING" },
        { status: "FAILED", failureReason: `Mobile Money transaction ${txnStatus}` },
        { returnDocument: "after" }
      );
      return res.status(400).json({
        success: false,
        message: "The Mobile Money transaction was declined or cancelled.",
        data: { payment },
      });
    }

    // Paid: move PENDING → HELD atomically so two confirm calls cannot both succeed
    const id = payment._id;
    payment = await Payment.findOneAndUpdate(
      { _id: id, status: "PENDING" },
      { status: "HELD", paidAt: new Date() },
      { returnDocument: "after" }
    );
    if (!payment) {
      return res.json({
        success: true,
        message: "Payment already processed.",
        data: { payment: await Payment.findById(id) },
      });
    }

    await Notification.create({
      userId: payment.customerId,
      title: "Payment Received 💳",
      message: `Your payment of ${payment.amount.toLocaleString()} FCFA is secured in escrow until you confirm the job is done.`,
      type: "PAYMENT",
    });

    // If the job is already completed, release straight away
    const serviceRequest = await ServiceRequest.findById(payment.serviceRequestId);
    if (serviceRequest && serviceRequest.status === "COMPLETED") {
      await releaseHeldPaymentsForRequest(serviceRequest._id);
      payment = await Payment.findById(payment._id);
    }

    return res.json({
      success: true,
      message:
        payment.status === "HELD"
          ? "Payment confirmed and held in escrow. It will be released to the artisan when you confirm the job is done."
          : `Payment confirmed and released (status: ${payment.status}).`,
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Payment history for the current user
 * GET /api/payments/history
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === "PROFESSIONAL") {
      const prof = await Professional.findOne({ userId: req.user._id });
      query.$or = [{ customerId: req.user._id }];
      if (prof) query.$or.push({ professionalId: prof._id });
    } else if (!isAdmin(req.user)) {
      query.customerId = req.user._id;
    }

    const payments = await Payment.find(query)
      .populate("customerId", "firstName lastName")
      .populate({
        path: "professionalId",
        select: "profession userId walletBalance",
        populate: { path: "userId", select: "firstName lastName" },
      })
      .populate("serviceRequestId", "description status")
      .sort({ createdAt: -1 });

    let walletBalance = null;
    if (req.user.role === "PROFESSIONAL") {
      const prof = await Professional.findOne({ userId: req.user._id }).select("walletBalance");
      walletBalance = prof ? prof.walletBalance : 0;
    }

    return res.json({
      success: true,
      data: payments,
      walletBalance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Platform DigiPay balance (admin only)
 * GET /api/payments/balance
 */
const getDigiPayBalance = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await digipayService.getBalance(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeeEstimate,
  initiatePayment,
  confirmPayment,
  getPaymentHistory,
  getDigiPayBalance,
};
