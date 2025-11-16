/**
 * Authentication Routes
 * Twitter OAuth 2.0 login flow with PKCE support
 */

import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { createHash, randomBytes } from "crypto";
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

// Helper function to generate PKCE code verifier and challenge
function generatePKCE() {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

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
    console.log(`   Using Twitter API v2 endpoints with PKCE`);
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
   * Initiate Twitter OAuth 2.0 login with PKCE
   */
  router.get("/twitter", (req: Request, res: Response, next: NextFunction) => {
    if (!isTwitterConfigured) {
      return res.status(503).json({
        error: "Twitter OAuth 2.0 not configured",
        message: "Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables",
        note: "Use OAuth 2.0 Client ID and Secret (not OAuth 1.0a Consumer Keys)",
      });
    }
    
    try {
      // Generate PKCE code verifier and challenge
      const { codeVerifier, codeChallenge } = generatePKCE();
      
      // Store code verifier in session for later use in callback
      (req.session as any).oauth2CodeVerifier = codeVerifier;
      
      // Generate state for CSRF protection
      const state = randomBytes(32).toString("base64url");
      (req.session as any).oauth2State = state;
      
      // Build authorization URL with PKCE
      const scopes = ["tweet.read", "users.read", "offline.access"].join(" ");
      const authParams = new URLSearchParams({
        response_type: "code",
        client_id: twitterClientId!,
        redirect_uri: callbackURL,
        scope: scopes,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
      
      const authUrl = `${TWITTER_AUTHORIZATION_URL}?${authParams.toString()}`;
      
      console.log(`🔐 Redirecting to Twitter OAuth 2.0 with PKCE`);
      res.redirect(authUrl);
    } catch (error: any) {
      console.error("❌ Error initiating Twitter OAuth 2.0:", error);
      return res.status(500).json({
        error: "Failed to initiate Twitter authentication",
        message: error.message || "An unexpected error occurred",
      });
    }
  });

  /**
   * GET /api/auth/twitter/callback
   * Twitter OAuth 2.0 callback with PKCE token exchange
   */
  router.get(
    "/twitter/callback",
    async (req: Request, res: Response, next: NextFunction) => {
      if (!isTwitterConfigured) {
        return res.status(503).json({
          error: "Twitter OAuth 2.0 not configured",
          message: "Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables",
          note: "Use OAuth 2.0 Client ID and Secret (not OAuth 1.0a Consumer Keys)",
        });
      }

      try {
        const { code, state, error } = req.query;

        // Check for errors from Twitter
        if (error) {
          console.error("❌ Twitter OAuth 2.0 error:", error);
          return res.redirect(`/login?error=twitter_auth_failed&details=${encodeURIComponent(String(error))}`);
        }

        // Verify state parameter (CSRF protection)
        const sessionState = (req.session as any)?.oauth2State;
        if (!state || state !== sessionState) {
          console.error("❌ State mismatch - possible CSRF attack");
          return res.redirect(`/login?error=state_mismatch`);
        }

        // Get code verifier from session
        const codeVerifier = (req.session as any)?.oauth2CodeVerifier;
        if (!codeVerifier) {
          console.error("❌ Code verifier not found in session");
          return res.redirect(`/login?error=session_expired`);
        }

        if (!code || typeof code !== "string") {
          console.error("❌ Authorization code not provided");
          return res.redirect(`/login?error=no_code`);
        }

        // Exchange authorization code for access token with PKCE
        console.log(`🔄 Exchanging authorization code for access token...`);
        const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${twitterClientId}:${twitterClientSecret}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            code: code,
            grant_type: "authorization_code",
            client_id: twitterClientId!,
            redirect_uri: callbackURL,
            code_verifier: codeVerifier,
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("❌ Token exchange failed:", errorText);
          return res.redirect(`/login?error=token_exchange_failed&details=${encodeURIComponent(errorText)}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch user profile from Twitter API v2
        console.log(`📱 Fetching user profile from Twitter API v2...`);
        const userInfoResponse = await fetch(TWITTER_USER_INFO_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text();
          console.error("❌ Failed to fetch Twitter user info:", errorText);
          return res.redirect(`/login?error=user_info_failed&details=${encodeURIComponent(errorText)}`);
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

        // Clear PKCE data from session
        delete (req.session as any).oauth2CodeVerifier;
        delete (req.session as any).oauth2State;

        // Create user object for passport session
        const user: Express.User = {
          userId: session.userId,
          twitterId: session.twitterId,
          twitterUsername: session.twitterUsername,
          displayName: session.displayName,
          profileImageUrl: session.profileImageUrl,
        };

        // Login user (create session)
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("❌ Error creating session:", loginErr);
            return res.redirect(`/login?error=session_failed`);
          }
          // Success - redirect to home
          return res.redirect("/");
        });
      } catch (error: any) {
        console.error("❌ Twitter OAuth 2.0 callback error:", error);
        return res.redirect(`/login?error=callback_failed&details=${encodeURIComponent(error.message || "Unknown error")}`);
      }
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
