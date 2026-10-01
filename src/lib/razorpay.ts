import crypto from "node:crypto";
import Razorpay from "razorpay";

export const razorpayEnabled = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/** Test keys (rzp_test_…) never move real money. */
export const razorpayTestMode = () => (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_");

export const razorpayWebhookConfigured = () => Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);

export const razorpay = () =>
  new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });

const hmac = (secret: string, data: string) => crypto.createHmac("sha256", secret).update(data).digest("hex");

const eq = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const verifyPaymentSignature = (orderId: string, paymentId: string, signature: string) =>
  eq(hmac(process.env.RAZORPAY_KEY_SECRET!, `${orderId}|${paymentId}`), signature);

export const verifyWebhookSignature = (body: string, signature: string) =>
  Boolean(process.env.RAZORPAY_WEBHOOK_SECRET) && eq(hmac(process.env.RAZORPAY_WEBHOOK_SECRET!, body), signature);
