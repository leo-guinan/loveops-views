import { Router, Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export function createPaymentRouter(): Router {
  const router = Router();

  // Create Stripe checkout session
  router.post("/checkout", async (req: Request, res: Response) => {
    try {
      const { userId, email, referralCode } = req.body;

      if (!userId || !email) {
        return res.status(400).json({ error: "userId and email are required" });
      }

      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}`;
      const cancelUrl = `${baseUrl}/payment/cancel?userId=${userId}`;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "LoveOps Profile Activation",
                description: "Activate your LoveOps profile to begin meeting people who match your relational architecture",
              },
              unit_amount: 10000, // $100.00 in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: email,
        metadata: {
          userId,
          referralCode: referralCode || "",
          type: "onboarding_fee",
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Verify payment success
  router.get("/verify", async (req: Request, res: Response) => {
    try {
      const { session_id } = req.query;

      if (!session_id || typeof session_id !== "string") {
        return res.status(400).json({ error: "session_id is required" });
      }

      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === "paid") {
        res.json({
          success: true,
          userId: session.metadata?.userId,
          sessionId: session.id,
        });
      } else {
        res.status(400).json({
          success: false,
          payment_status: session.payment_status,
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  return router;
}

