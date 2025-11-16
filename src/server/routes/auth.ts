/**
 * Authentication Routes
 * Twitter OAuth login flow
 */

import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { AuthService, TwitterUser } from "../../services/AuthService";
import { WorldModelService } from "../../services/WorldModelService";
import { PolicyService } from "../../services/PolicyService";
import { QueueService } from "../../services/QueueService";

// Extend Express Request to include user session
declare global {
  namespace Express {
    interface User {
      userId: string;
      twitterId: string;
      twitterUsername: string;
      displayName: string;
      profileImageUrl?: string;
    }
  }
}

export function createAuthRouter(
  authService: AuthService,
  worldModel: WorldModelService,
  policy: PolicyService
): Router {
  const router = Router();

  // Twitter OAuth Strategy
  // NOTE: passport-twitter uses OAuth 1.0a (deprecated by Twitter)
  // For OAuth 2.0, consider using passport-oauth2 or implementing custom Twitter OAuth 2.0 flow
  // See: https://developer.twitter.com/en/docs/authentication/oauth-2-0
  const twitterClientId = process.env.TWITTER_CLIENT_ID?.trim();
  const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET?.trim();
  const callbackURL = process.env.TWITTER_CALLBACK_URL || 
    `${process.env.BASE_URL || "http://localhost:3000"}/api/auth/twitter/callback`;

  const isTwitterConfigured = twitterClientId && twitterClientSecret && twitterClientId.length > 0 && twitterClientSecret.length > 0;

  if (!isTwitterConfigured) {
    console.warn("⚠️  Twitter OAuth credentials not configured. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET");
    console.warn("   Twitter OAuth routes will return 503 errors until configured.");
  } else {
    console.log(`✅ Twitter OAuth configured with callback: ${callbackURL}`);
    // Using OAuth 1.0a for now (passport-twitter)
    // TODO: Migrate to OAuth 2.0 when Twitter fully deprecates 1.0a
    passport.use(
      "twitter",
      new TwitterStrategy(
        {
          consumerKey: twitterClientId,
          consumerSecret: twitterClientSecret,
          callbackURL,
          includeEmail: false, // Twitter API v2 doesn't include email by default
        },
        async (token: string, tokenSecret: string, profile: any, done: any) => {
          try {
            console.log(`📱 Twitter OAuth callback received for user: @${profile.username}`);
            const twitterUser: TwitterUser = {
              id: profile.id,
              username: profile.username,
              displayName: profile.displayName,
              profileImageUrl: profile.photos?.[0]?.value,
            };

            const userId = await authService.createOrGetUser(twitterUser);
            const session = authService.buildSession(twitterUser, userId);

            console.log(`✅ Twitter OAuth successful for user: ${userId} (@${twitterUser.username})`);
            return done(null, {
              userId: session.userId,
              twitterId: session.twitterId,
              twitterUsername: session.twitterUsername,
              displayName: session.displayName,
              profileImageUrl: session.profileImageUrl,
            });
          } catch (error) {
            console.error("❌ Error in Twitter OAuth callback:", error);
            return done(error, null);
          }
        }
      )
    );
  }

  // Serialize user for session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.userId);
  });

  // Deserialize user from session
  passport.deserializeUser(async (userId: string, done) => {
    try {
      // Get user profile from world model
      const events = await worldModel["client"].getEventsForUser(userId);
      const profile = await worldModel["client"].evalView<any>("UserProfileStateView", events);
      
      // Extract Twitter-related fields from profile (may be stored in different ways)
      const twitterId = (profile as any)?.twitterId || (profile as any)?.social?.twitter?.id || "";
      const twitterUsername = (profile as any)?.twitterUsername || (profile as any)?.social?.twitter?.username || "";
      const displayName = (profile as any)?.displayName || (profile as any)?.core?.name || "";
      const profileImageUrl = (profile as any)?.profileImageUrl || (profile as any)?.photos?.[0] || undefined;
      
      done(null, {
        userId,
        twitterId,
        twitterUsername,
        displayName,
        profileImageUrl,
      });
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  // Initialize Passport
  router.use(passport.initialize());
  router.use(passport.session());

  /**
   * GET /api/auth/twitter
   * Initiate Twitter OAuth login
   */
  router.get("/twitter", (req: Request, res: Response, next: NextFunction) => {
    if (!isTwitterConfigured) {
      return res.status(503).json({
        error: "Twitter OAuth not configured",
        message: "Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables",
      });
    }
    passport.authenticate("twitter")(req, res, next);
  });

  /**
   * GET /api/auth/twitter/callback
   * Twitter OAuth callback
   */
  router.get(
    "/twitter/callback",
    (req: Request, res: Response, next: NextFunction) => {
      if (!isTwitterConfigured) {
        return res.status(503).json({
          error: "Twitter OAuth not configured",
          message: "Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables",
        });
      }
      passport.authenticate("twitter", {
        failureRedirect: "/login?error=twitter_auth_failed",
        successRedirect: "/",
      })(req, res, next);
    }
  );

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  router.get("/me", (req: Request, res: Response) => {
    if (req.user) {
      res.json({
        authenticated: true,
        user: {
          userId: req.user.userId,
          twitterUsername: req.user.twitterUsername,
          displayName: req.user.displayName,
          profileImageUrl: req.user.profileImageUrl,
        },
      });
    } else {
      res.status(401).json({
        authenticated: false,
        error: "Not authenticated",
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  router.post("/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Error logging out:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  return router;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

/**
 * Middleware to get authenticated userId (returns null if not authenticated)
 */
export function getAuthenticatedUserId(req: Request): string | null {
  return req.user?.userId || null;
}
