import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
// Placeholder imports - replace with actual packages when available
// import { LoveopsRhizomeClient } from "loveops-policy/dist/adapters/rhizome/LoveopsRhizomeClient";
// import { MatchingEngine } from "loveops-policy/dist/engines/matching/MatchingEngine";
// import { CoachingEngine } from "loveops-policy/dist/engines/coaching/CoachingEngine";
import { LoveopsRhizomeClient, MatchingEngine, CoachingEngine } from "../types/loveops-policy";
import { WorldModelService } from "../services/WorldModelService";
import { PolicyService } from "../services/PolicyService";
import { createUserRouter } from "./routes/user";
import { createMatchesRouter } from "./routes/matches";
import { createCoachingRouter } from "./routes/coaching";
import { createAdminRouter } from "./routes/admin";

dotenv.config();

const PORT = process.env.PORT || 3000;
const RHIZOME_NODE_URL = process.env.RHIZOME_NODE_URL || "http://localhost:3001";

async function createApp(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Serve static files from dist/public (built React app) or public (fallback)
  app.use(express.static("dist/public"));
  app.use(express.static("public"));

  // Initialize services
  const rhizomeClient = new LoveopsRhizomeClient(RHIZOME_NODE_URL);
  const worldModelService = new WorldModelService(rhizomeClient);

  const matchingEngine = new MatchingEngine(rhizomeClient);
  const coachingEngine = new CoachingEngine(rhizomeClient);
  const policyService = new PolicyService(matchingEngine, coachingEngine);

  // Routes
  app.use("/api/user", createUserRouter(worldModelService, policyService));
  app.use("/api/matches", createMatchesRouter(worldModelService, policyService));
  app.use("/api/coaching", createCoachingRouter(policyService));
  app.use("/api/admin", createAdminRouter(worldModelService, policyService));

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

