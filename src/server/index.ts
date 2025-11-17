import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import passport from "passport";
// Placeholder imports - replace with actual packages when available
// import { LoveopsRhizomeClient } from "loveops-policy/dist/adapters/rhizome/LoveopsRhizomeClient";
// import { MatchingEngine } from "loveops-policy/dist/engines/matching/MatchingEngine";
// import { CoachingEngine } from "loveops-policy/dist/engines/coaching/CoachingEngine";
import { LoveopsRhizomeClient, MatchingEngine, CoachingEngine } from "../types/loveops-policy";
import { WorldModelService } from "../services/WorldModelService";
import { PolicyService } from "../services/PolicyService";
import { ViewsQueueProcessor } from "../services/ViewsQueueProcessor";
import { AuthService } from "../services/AuthService";
import { QueueService } from "../services/QueueService";
import { createUserRouter } from "./routes/user";
import { createMatchesRouter } from "./routes/matches";
import { createCoachingRouter } from "./routes/coaching";
import { createAdminRouter } from "./routes/admin";
import { createPaymentRouter } from "./routes/payment";
import { createOnboardingRouter } from "./routes/onboarding";
import { createAuthRouter } from "./routes/auth";

dotenv.config();

const PORT = process.env.PORT || 3000;
const RHIZOME_NODE_URL = process.env.RHIZOME_NODE_URL || "http://localhost:3001";

async function createApp(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }));
  app.use(express.json());
  
  // Session configuration
  const sessionSecret = process.env.SESSION_SECRET || "change-me-in-production-" + Date.now();
  
  // Session middleware - must be before routes
  app.use(
    session({
      secret: sessionSecret,
      resave: true, // Save session even if not modified (needed for OAuth redirects)
      saveUninitialized: true, // Create session even if empty (needed for OAuth flow)
      cookie: {
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax", // Allow OAuth redirects but protect against CSRF
        path: "/", // Available on all paths
      },
      name: "loveops.sid", // Explicit session name
    })
  );
  
  // Log session creation for debugging
  app.use((req, res, next) => {
    if (req.session && !(req.session as any).logged) {
      (req.session as any).logged = true;
      console.log(`📝 Session accessed: ${req.sessionID} (cookie: ${req.headers.cookie ? "present" : "missing"})`);
    }
    next();
  });
  
  // Initialize services (needed for Passport serialization)
  const rhizomeClient = new LoveopsRhizomeClient(RHIZOME_NODE_URL);
  const worldModelService = new WorldModelService(rhizomeClient);
  const queueService = new QueueService();

  const matchingEngine = new MatchingEngine(rhizomeClient);
  const coachingEngine = new CoachingEngine(rhizomeClient);
  const policyService = new PolicyService(matchingEngine, coachingEngine);
  const authService = new AuthService(rhizomeClient, queueService);

  // Configure Passport serialization BEFORE initializing middleware
  // This must happen before passport.initialize() and passport.session()
  passport.serializeUser((user: Express.User, done) => {
    console.log(`📦 Serializing user: ${user.userId}`);
    done(null, user.userId);
  });

  passport.deserializeUser(async (userId: string, done) => {
    console.log(`📦 Deserializing user: ${userId}`);
    try {
      // Get user profile from world model
      const events = await worldModelService["client"].getEventsForUser(userId);
      
      if (!events || events.length === 0) {
        // No events found, return minimal user info
        console.warn(`⚠️  No events found for user ${userId} during deserialization`);
        done(null, {
          userId,
          twitterId: "",
          twitterUsername: "",
          displayName: "",
          profileImageUrl: undefined,
        });
        return;
      }
      
      const profile = await worldModelService["client"].evalView<any>("UserProfileStateView", events);
      
      // Extract Twitter-related fields from profile
      const twitterId = (profile as any)?.twitterId || (profile as any)?.social?.twitter?.id || "";
      const twitterUsername = (profile as any)?.twitterUsername || (profile as any)?.social?.twitter?.username || "";
      const displayName = (profile as any)?.displayName || (profile as any)?.core?.name || "";
      const profileImageUrl = (profile as any)?.profileImageUrl || (profile as any)?.photos?.[0] || undefined;
      
      console.log(`✅ Deserialized user: ${userId} (@${twitterUsername})`);
      done(null, {
        userId,
        twitterId,
        twitterUsername,
        displayName,
        profileImageUrl,
      });
    } catch (error) {
      console.error("❌ Error deserializing user:", error);
      // Don't fail completely - return minimal user info
      done(null, {
        userId,
        twitterId: "",
        twitterUsername: "",
        displayName: "",
        profileImageUrl: undefined,
      });
    }
  });

  // Initialize Passport middleware - MUST be after session and serialization setup
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Serve static files from dist/public (built React app) or public (fallback)
  app.use(express.static("dist/public"));
  app.use(express.static("public"));

  // Start in-process queue processor
  const queueProcessor = new ViewsQueueProcessor(worldModelService, policyService);
  queueProcessor.start("views");

  // Routes (Passport serialization is already configured above)
  app.use("/api/auth", createAuthRouter(authService, worldModelService, policyService));
  app.use("/api/user", createUserRouter(worldModelService, policyService));
  app.use("/api/matches", createMatchesRouter(worldModelService, policyService));
  app.use("/api/coaching", createCoachingRouter(policyService));
  app.use("/api/admin", createAdminRouter(worldModelService, policyService));
  app.use("/api/payment", createPaymentRouter());
  app.use("/api/onboarding", createOnboardingRouter(worldModelService, policyService));

  // Serve React app for all non-API routes
  app.get("*", (req, res, next) => {
    // Don't serve React app for API routes
    if (req.path.startsWith("/api")) {
      return next();
    }
    // Serve the built React app's index.html from dist/public
    // When server is built, __dirname is dist/server, so ../public is dist/public
    const indexPath = path.join(__dirname, "../public/index.html");
    res.sendFile(indexPath);
  });

  // Error handling middleware (must be last)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("❌ Unhandled error:", err);
    console.error("   Stack:", err.stack);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== "production";
    
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      ...(isDevelopment && { stack: err.stack, details: err }),
    });
  });

  return app;
}

async function startServer() {
  try {
    const app = await createApp();
    
    app.listen(PORT, () => {
      console.log(`🚀 loveops-interface server running on port ${PORT}`);
      console.log(`📡 Connected to Rhizome node: ${RHIZOME_NODE_URL}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

