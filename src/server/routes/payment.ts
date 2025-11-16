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

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Check Stripe configuration
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY not configured");
        return res.status(500).json({ 
          error: "Payment system not configured. Please contact support.",
          details: "STRIPE_SECRET_KEY environment variable is missing"
        });
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
        ...(email ? { customer_email: email } : {}), // Only include email if provided
        metadata: {
          userId,
          referralCode: referralCode || "",
          type: "onboarding_fee",
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);

      console.log(`✅ Created Stripe checkout session: ${session.id} for user ${userId}`);

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorDetails = error instanceof Stripe.errors.StripeError 
        ? error.message 
        : errorMessage;
      
      res.status(500).json({ 
        error: "Failed to create checkout session",
        details: errorDetails
      });
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

