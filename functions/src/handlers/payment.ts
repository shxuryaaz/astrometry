import express from "express";
import * as admin from "firebase-admin";
import { verifyFirebaseIdToken } from "../middleware/auth";
import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";

const router = express.Router();

// Initialize payment providers
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface CreateOrderRequest {
  amount: number;
  currency: string;
  provider: 'razorpay' | 'stripe';
  credits: number;
}

// Create Razorpay order
router.post("/create-order/razorpay", verifyFirebaseIdToken, async (req, res) => {
  const uid = (req as any).uid;
  const { amount, currency = 'INR', credits }: CreateOrderRequest = req.body;

  if (!amount || !credits) {
    return res.status(400).json({ error: "Missing amount or credits" });
  }

  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `astroai_${uid}_${Date.now()}`,
      notes: {
        userId: uid,
        credits: credits.toString(),
        provider: 'razorpay'
      }
    };

    const order = await razorpay.orders.create(options);

    // Store payment intent in Firestore
    await admin.firestore().collection("payments").add({
      userId: uid,
      amount,
      currency,
      credits,
      provider: 'razorpay',
      providerOrderId: order.id,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

// Create Stripe checkout session
router.post("/create-checkout/stripe", verifyFirebaseIdToken, async (req, res) => {
  const uid = (req as any).uid;
  const { amount, currency = 'USD', credits }: CreateOrderRequest = req.body;

  if (!amount || !credits) {
    return res.status(400).json({ error: "Missing amount or credits" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `${credits} AstroAI Credits`,
              description: `Purchase ${credits} questions for AstroAI`,
            },
            unit_amount: amount * 100, // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_SITE_URL}/payment/cancel`,
      metadata: {
        userId: uid,
        credits: credits.toString(),
        provider: 'stripe'
      }
    });

    // Store payment intent in Firestore
    await admin.firestore().collection("payments").add({
      userId: uid,
      amount,
      currency,
      credits,
      provider: 'stripe',
      providerOrderId: session.id,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error("Stripe session creation failed:", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Razorpay webhook
router.post("/webhook/razorpay", express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = req.body;

  if (!signature) {
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error("Invalid Razorpay webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = body;
    
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      
      // Find the payment record
      const paymentsSnap = await admin.firestore()
        .collection("payments")
        .where("providerOrderId", "==", payment.order_id)
        .limit(1)
        .get();

      if (paymentsSnap.empty) {
        console.error("Payment record not found for order:", payment.order_id);
        return res.status(404).json({ error: "Payment record not found" });
      }

      const paymentDoc = paymentsSnap.docs[0];
      const paymentData = paymentDoc.data();

      // Update payment status
      await paymentDoc.ref.update({
        status: 'paid',
        providerPaymentId: payment.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Increment user credits atomically
      const userRef = admin.firestore().collection("users").doc(paymentData.userId);
      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const currentCredits = userDoc.data()?.credits || 0;
          transaction.update(userRef, {
            credits: currentCredits + paymentData.credits,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });

      console.log(`Payment successful for user ${paymentData.userId}, credits added: ${paymentData.credits}`);
    }

    return res.json({ received: true });

  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Stripe webhook
router.post("/webhook/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const body = req.body;

  if (!sig) {
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Find the payment record
      const paymentsSnap = await admin.firestore()
        .collection("payments")
        .where("providerOrderId", "==", session.id)
        .limit(1)
        .get();

      if (paymentsSnap.empty) {
        console.error("Payment record not found for session:", session.id);
        return res.status(404).json({ error: "Payment record not found" });
      }

      const paymentDoc = paymentsSnap.docs[0];
      const paymentData = paymentDoc.data();

      // Update payment status
      await paymentDoc.ref.update({
        status: 'paid',
        providerPaymentId: session.payment_intent,
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Increment user credits atomically
      const userRef = admin.firestore().collection("users").doc(paymentData.userId);
      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const currentCredits = userDoc.data()?.credits || 0;
          transaction.update(userRef, {
            credits: currentCredits + paymentData.credits,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });

      console.log(`Payment successful for user ${paymentData.userId}, credits added: ${paymentData.credits}`);
    }

    return res.json({ received: true });

  } catch (error) {
    console.error("Stripe webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Get user's payment history
router.get("/history", verifyFirebaseIdToken, async (req, res) => {
  const uid = (req as any).uid;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const paymentsSnap = await admin.firestore()
      .collection("payments")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const payments = paymentsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      paidAt: doc.data().paidAt?.toDate?.() || null
    }));

    return res.json({ payments });

  } catch (err) {
    console.error("Payment history error:", err);
    return res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

export default router;

