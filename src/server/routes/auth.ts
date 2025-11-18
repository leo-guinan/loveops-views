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

// Helper to encode state with code verifier (for when session doesn't persist)
function encodeStateWithVerifier(state: string, codeVerifier: string): string {
  const payload = JSON.stringify({ state, codeVerifier });
  return Buffer.from(payload).toString("base64url");
}

// Helper to decode state with code verifier
function decodeStateWithVerifier(encoded: string): { state: string; codeVerifier: string } | null {
  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
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

  // Note: Passport serialization/deserialization is configured in server/index.ts
  // before passport middleware is initialized. This ensures it works correctly.

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
      
      // Store in session (for verification)
      (req.session as any).oauth2State = state;
      (req.session as any).oauth2CodeVerifier = codeVerifier;
      
      // Also encode state with code verifier as fallback (in case session doesn't persist)
      // This is less secure but works when cookies don't persist
      const encodedState = encodeStateWithVerifier(state, codeVerifier);
      
      console.log(`🔐 Generated state: ${state.substring(0, 16)}... (session ID: ${req.sessionID})`);
      
      // Build authorization URL with PKCE
      const scopes = ["tweet.read", "users.read", "offline.access"].join(" ");
      const authParams = new URLSearchParams({
        response_type: "code",
        client_id: twitterClientId!,
        redirect_uri: callbackURL,
        scope: scopes,
        state: encodedState, // Use encoded state that includes code verifier
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
      
      const authUrl = `${TWITTER_AUTHORIZATION_URL}?${authParams.toString()}`;
      
      console.log(`🔐 Redirecting to Twitter OAuth 2.0 with PKCE`);
      console.log(`   State: ${state.substring(0, 16)}...`);
      console.log(`   Session ID: ${req.sessionID}`);
      console.log(`   Cookie header: ${req.headers.cookie ? "present" : "missing"}`);
      console.log(`   Session saved: oauth2State=${!!(req.session as any).oauth2State}, oauth2CodeVerifier=${!!(req.session as any).oauth2CodeVerifier}`);
      
      // Save session before redirect to ensure state is persisted
      req.session.save((err) => {
        if (err) {
          console.error("❌ Error saving session before redirect:", err);
          return res.status(500).json({
            error: "Failed to save session",
            message: "Please try again",
          });
        }
        console.log(`💾 Session saved successfully before redirect`);
        // Set cookie explicitly to ensure it's sent
        res.cookie("loveops.sid", req.sessionID, {
          httpOnly: true,
          secure: false, // false for localhost
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: "/",
        });
        res.redirect(authUrl);
      });
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
        console.log(`🔍 Callback received - Session ID: ${req.sessionID}`);
        console.log(`   Cookie header: ${req.headers.cookie ? "present" : "missing"}`);
        console.log(`   Session exists: ${!!req.session}`);
        console.log(`   Received encoded state: ${state}`);
        
        if (!state || typeof state !== "string") {
          console.error("❌ No state parameter received from Twitter");
          return res.redirect(`/login?error=no_state`);
        }
        
        // Decode state to get original state and code verifier
        const decoded = decodeStateWithVerifier(state);
        if (!decoded) {
          console.error("❌ Failed to decode state parameter");
          return res.redirect(`/login?error=invalid_state`);
        }
        
        const { state: originalState, codeVerifier } = decoded;
        console.log(`   Decoded state: ${originalState.substring(0, 16)}...`);
        console.log(`   Code verifier: ${codeVerifier ? "present" : "missing"}`);
        
        // Try to verify against session state if available (for CSRF protection)
        const sessionState = (req.session as any)?.oauth2State;
        if (sessionState) {
          if (originalState !== sessionState) {
            console.warn("⚠️  State mismatch with session - but using encoded state");
            // In production, this could be a security issue
            if (process.env.NODE_ENV === "production") {
              console.error("❌ State mismatch in production - possible CSRF attack");
              return res.redirect(`/login?error=state_mismatch`);
            }
          } else {
            console.log(`✅ State matches session - CSRF protection verified`);
          }
        } else {
          console.warn("⚠️  No session state found - using encoded state (session may not have persisted)");
        }
        
        if (!codeVerifier) {
          console.error("❌ Code verifier not found in decoded state");
          return res.redirect(`/login?error=no_code_verifier`);
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
          
          console.log(`✅ Passport login successful for user: ${user.userId}`);
          console.log(`   Session ID: ${req.sessionID}`);
          console.log(`   User serialized: ${user.userId}`);
          console.log(`   Passport session after login: ${JSON.stringify((req.session as any).passport || "none")}`);
          
          // Ensure passport session is set (sometimes req.login doesn't set it immediately)
          if (!(req.session as any).passport) {
            console.warn("⚠️  Passport session not set after req.login, setting manually");
            (req.session as any).passport = { user: user.userId };
          }
          
          // Regenerate session to ensure cookie is set (helps with some browsers)
          req.session.regenerate((regenerateErr) => {
            if (regenerateErr) {
              console.error("❌ Error regenerating session:", regenerateErr);
              // Continue anyway - try saving
            }
            
            // Set passport session again after regeneration
            (req.session as any).passport = { user: user.userId };
            
            // Save session before redirect to ensure it's persisted
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error("❌ Error saving session after login:", saveErr);
                return res.redirect(`/login?error=session_save_failed`);
              }
              console.log(`💾 Session saved after login`);
              console.log(`   Final passport session: ${JSON.stringify((req.session as any).passport || "none")}`);
              console.log(`   Session ID: ${req.sessionID}`);
              
              // Set cookie explicitly to ensure it's sent
              res.cookie("loveops.sid", req.sessionID, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
              });
              
              // Success - redirect to home
              return res.redirect("/");
            });
          });
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
    console.log(`🔍 /api/auth/me called - Session ID: ${req.sessionID}`);
    console.log(`   Cookie header: ${req.headers.cookie ? "present" : "missing"}`);
    console.log(`   req.user: ${req.user ? "present" : "null"}`);
    console.log(`   Session exists: ${!!req.session}`);
    console.log(`   Session passport: ${JSON.stringify((req.session as any).passport || "none")}`);
    
    // Check if passport session exists
    const passportSession = (req.session as any).passport;
    if (passportSession) {
      console.log(`   Passport session found: ${JSON.stringify(passportSession)}`);
    } else {
      console.log(`   ⚠️  No passport session found in req.session`);
    }
    
    if (req.user) {
      console.log(`✅ User authenticated: ${req.user.userId} (@${req.user.twitterUsername})`);
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
      console.log(`❌ User not authenticated - req.user is null`);
      console.log(`   Session passport data: ${passportSession ? JSON.stringify(passportSession) : "none"}`);
      console.log(`   This usually means passport.deserializeUser didn't populate req.user`);
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
