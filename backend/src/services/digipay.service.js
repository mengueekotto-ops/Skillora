/**
 * DigiPay Mobile Money integration (digipay-sdk).
 *
 * Set DIGIPAY_MOCK=true in development to use a local mock that approves every payment
 * instantly (no real money moves). The mock can never be used in production.
 */

const USE_MOCK = process.env.DIGIPAY_MOCK === "true";

if (USE_MOCK && process.env.NODE_ENV === "production") {
  throw new Error("DIGIPAY_MOCK=true is not allowed in production.");
}

class MockDigiPay {
  constructor() {
    const id = (prefix) => `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.payments = {
      initiate: async ({ amount, customerPhone }) => ({
        transactionId: id("MOCK-TX"),
        amount,
        baseAmount: amount,
        commissionAmount: 0,
        status: "pending",
        customerPhone,
        message: "Mock Mobile Money push initiated",
      }),
      getStatus: async (transactionId) => ({ transactionId, status: "success" }),
    };
    this.settlements = {
      getBalance: async () => ({ balance: 0, totalRevenue: 0, totalCommissionPaid: 0 }),
      requestPayout: async ({ amount, recipientPhone }) => ({
        settlementId: id("MOCK-PO"),
        amount,
        recipientPhone,
        status: "success",
        createdAt: new Date().toISOString(),
      }),
    };
  }
}

function createClient() {
  if (USE_MOCK) {
    console.warn("⚠️ DIGIPAY_MOCK=true — using the DigiPay MOCK client (development only, no real money moves).");
    return new MockDigiPay();
  }

  const apiKey = process.env.DIGIPAY_API_KEY;
  if (!apiKey || apiKey === "dpk_YOUR_API_KEY") {
    throw new Error("DIGIPAY_API_KEY is not configured. Set it in backend/.env (or DIGIPAY_MOCK=true in development).");
  }

  const sdk = require("digipay-sdk");
  const DigiPay = sdk.DigiPay || sdk.default || sdk;
  return new DigiPay({
    apiKey,
    environment: process.env.DIGIPAY_ENV === "sandbox" ? "sandbox" : "production",
  });
}

/**
 * DigiPay expects international format without "+", e.g. 237699000000.
 * Accepts "699 00 00 00", "+237699000000", "00237699000000", ...
 */
function toInternationalPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `237${digits}`; // Cameroon local number
  if (!/^\d{11,15}$/.test(digits)) {
    throw new Error(`Invalid Mobile Money number: ${phone}`);
  }
  return digits;
}

class DigiPayService {
  constructor() {
    this._client = null;
    this.platformOrangeNumber = process.env.PLATFORM_ORANGE_NUMBER || "";
    this.feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENT || "2");
  }

  // Created on first use so the API can start (and serve non-payment routes) without DigiPay configured
  get client() {
    if (!this._client) this._client = createClient();
    return this._client;
  }

  /** Split a payment: platform commission and artisan payout */
  calculateFeeBreakdown(totalAmount) {
    const amount = Math.round(Number(totalAmount) || 0);
    const platformFee = Math.round(amount * (this.feePercentage / 100));
    return {
      totalAmount: amount,
      platformFee,
      artisanAmount: amount - platformFee,
      feePercentage: this.feePercentage,
      platformOrangeNumber: this.platformOrangeNumber,
    };
  }

  async getBalance() {
    return this.client.settlements.getBalance();
  }

  /** Send a Mobile Money payment request to the customer's phone */
  async initiatePayIn({ amount, customerPhone, customerEmail, metadata }) {
    return this.client.payments.initiate({
      amount: Number(amount),
      customerPhone: toInternationalPhone(customerPhone),
      customerEmail: customerEmail || undefined,
      metadata,
    });
  }

  /** Returns { status: 'pending' | 'success' | 'failed' | 'refunded', ... } */
  async getTransactionStatus(transactionId) {
    return this.client.payments.getStatus(transactionId);
  }

  /** Withdraw funds to a Mobile Money number. Throws if DigiPay reports a failure. */
  async requestPayout({ amount, recipientPhone }) {
    const payout = await this.client.settlements.requestPayout({
      amount: Number(amount),
      recipientPhone: toInternationalPhone(recipientPhone),
    });
    if (String(payout?.status).toLowerCase() === "failed") {
      throw new Error(`Payout of ${amount} XAF to ${recipientPhone} failed`);
    }
    return { ...payout, payoutId: payout.settlementId };
  }

  /** Pay the platform commission and the artisan's share */
  async processSplitPayouts({ totalAmount, artisanPhone }) {
    const breakdown = this.calculateFeeBreakdown(totalAmount);

    if (breakdown.artisanAmount > 0 && !artisanPhone) {
      throw new Error("The artisan has no phone number on file to receive the payout.");
    }

    let platformPayout = null;
    if (breakdown.platformFee > 0 && this.platformOrangeNumber) {
      platformPayout = await this.requestPayout({
        amount: breakdown.platformFee,
        recipientPhone: this.platformOrangeNumber,
      });
    }

    let artisanPayout = null;
    if (breakdown.artisanAmount > 0) {
      artisanPayout = await this.requestPayout({
        amount: breakdown.artisanAmount,
        recipientPhone: artisanPhone,
      });
    }

    return { breakdown, platformPayout, artisanPayout };
  }
}

module.exports = new DigiPayService();
module.exports.toInternationalPhone = toInternationalPhone;
