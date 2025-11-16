/**
 * Authentication Routes
 * Twitter OAuth 2.0 login flow
 */

import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
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

// Twitter OAuth 2.0 endpoints
const TWITTER_AUTHORIZATION_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_USER_INFO_URL = "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name";

export function createAuthRouter(
  authService: AuthService,
  worldModel: WorldModelService,
  policy: PolicyService
): Router {
  const router = Router();

  // Twitter OAuth 2.0 Configuration
  const twitterClientId = process.env.TWITTER_CLIENT_ID?.trim();
  const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET?.trim();
  const callbackURL = process.env.TWITTER_CALLBACK_URL || 
    `${process.env.BASE_URL || "http://localhost:3000"}/api/auth/twitter/callback`;

  const isTwitterConfigured = twitterClientId && twitterClientSecret && twitterClientId.length > 0 && twitterClientSecret.length > 0;

  if (!isTwitterConfigured) {
    console.warn("⚠️  Twitter OAuth 2.0 credentials not configured. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET");
    console.warn("   Twitter OAuth routes will return 503 errors until configured.");
    console.warn("   Note: Use OAuth 2.0 Client ID and Secret (not OAuth 1.0a Consumer Keys)");
  } else {
    console.log(`✅ Twitter OAuth 2.0 configured with callback: ${callbackURL}`);
    console.log(`   Client ID: ${twitterClientId.substring(0, 8)}...`);
    console.log(`   Using Twitter API v2 endpoints`);
    
    // Custom Twitter OAuth 2.0 Strategy
    try {
      passport.use(
        "twitter-oauth2",
        new OAuth2Strategy(
          {
            authorizationURL: TWITTER_AUTHORIZATION_URL,
            tokenURL: TWITTER_TOKEN_URL,
            clientID: twitterClientId,
            clientSecret: twitterClientSecret,
            callbackURL: callbackURL,
            scope: ["tweet.read", "users.read", "offline.access"], // Request read permissions
            state: true, // Use state parameter for CSRF protection
          },
          async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
            try {
              // Fetch user profile from Twitter API v2
              // Note: passport-oauth2 doesn't automatically fetch profile, so we do it manually
              const userInfoResponse = await fetch(TWITTER_USER_INFO_URL, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!userInfoResponse.ok) {
                const errorText = await userInfoResponse.text();
                console.error("❌ Failed to fetch Twitter user info:", errorText);
                throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
              }

              const userData = await userInfoResponse.json();
              const twitterUserData = userData.data;

              console.log(`📱 Twitter OAuth 2.0 callback received for user: @${twitterUserData.username}`);

              const twitterUser: TwitterUser = {
                id: twitterUserData.id,
                username: twitterUserData.username,
                displayName: twitterUserData.name,
                profileImageUrl: twitterUserData.profile_image_url,
              };

              const userId = await authService.createOrGetUser(twitterUser);
              const session = authService.buildSession(twitterUser, userId);

              console.log(`✅ Twitter OAuth 2.0 successful for user: ${userId} (@${twitterUser.username})`);
              return done(null, {
                userId: session.userId,
                twitterId: session.twitterId,
                twitterUsername: session.twitterUsername,
                displayName: session.displayName,
                profileImageUrl: session.profileImageUrl,
              });
            } catch (error) {
              console.error("❌ Error in Twitter OAuth 2.0 callback:", error);
              return done(error, null);
            }
          }
        )
      );
      console.log(`✅ Twitter OAuth 2.0 strategy registered successfully`);
    } catch (error) {
      console.error("❌ Failed to register Twitter OAuth 2.0 strategy:", error);
      console.error("   This may be due to invalid credentials or configuration issues");
    }
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
      
      if (!events || events.length === 0) {
        // No events found, return minimal user info
        console.warn(`No events found for user ${userId} during deserialization`);
        done(null, {
          userId,
          twitterId: "",
          twitterUsername: "",
          displayName: "",
          profileImageUrl: undefined,
        });
        return;
      }
      
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

  // Initialize Passport
  router.use(passport.initialize());
  router.use(passport.session());

  /**
   * GET /api/auth/twitter
   * Initiate Twitter OAuth 2.0 login
   */
  router.get("/twitter", (req: Request, res: Response, next: NextFunction) => {
    if (!isTwitterConfigured) {
      return res.status(503).json({
        error: "Twitter OAuth not configured",
        message: "Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables",
      });
    }
    
    // Use passport.authenticate with error handling
    passport.authenticate("twitter-oauth2", {
      scope: ["tweet.read", "users.read", "offline.access"],
    })(req, res, (err: any) => {
      if (err) {
        console.error("❌ Twitter OAuth 2.0 error:", err);
        console.error("   Error details:", err.message);
        console.error("   This usually means:");
        console.error("   1. Invalid API credentials (check TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET)");
        console.error("   2. Callback URL mismatch (check TWITTER_CALLBACK_URL matches Twitter app settings)");
        console.error("   3. Twitter app not properly configured (check OAuth 2.0 is enabled)");
        
        return res.status(500).json({
          error: "Twitter authentication failed",
          message: err.message || "Could not authenticate with Twitter",
          details: "Check your Twitter API credentials and callback URL configuration",
          troubleshooting: {
            step1: "Verify TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET are correct (OAuth 2.0 credentials)",
            step2: "Ensure callback URL in Twitter app matches: http://localhost:3000/api/auth/twitter/callback",
            step3: "Check that OAuth 2.0 is enabled in your Twitter app settings",
            step4: "Verify your Twitter app has 'Read' permissions enabled",
          },
        });
      }
      // If no error, passport should redirect to Twitter
      next();
    });
  });

  /**
   * GET /api/auth/twitter/callback
   * Twitter OAuth 2.0 callback
   */
  router.get(
    "/twitter/callback",
    (req: Request, res: Response, next: NextFunction) => {
      if (!isTwitterConfigured) {
        return res.status(503).json({
          error: "Twitter OAuth 2.0 not configured",
          message: "Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables",
          note: "Use OAuth 2.0 Client ID and Secret (not OAuth 1.0a Consumer Keys)",
        });
      }
      passport.authenticate("twitter-oauth2", (err: any, user: any, info: any) => {
        if (err) {
          console.error("❌ Twitter OAuth 2.0 callback error:", err);
          return res.redirect(`/login?error=twitter_auth_failed&details=${encodeURIComponent(err.message || "Authentication failed")}`);
        }
        if (!user) {
          console.error("❌ Twitter OAuth 2.0 callback: No user", info);
          return res.redirect(`/login?error=twitter_auth_failed&details=${encodeURIComponent(info?.message || "Could not authenticate")}`);
        }
        // Login successful - create session
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("❌ Error creating session:", loginErr);
            return res.redirect(`/login?error=session_failed`);
          }
          // Success - redirect to home
          return res.redirect("/");
        });
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
