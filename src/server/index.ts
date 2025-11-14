import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { LoveopsRhizomeClient } from "loveops-policy/dist/adapters/rhizome/LoveopsRhizomeClient";
import { MatchingEngine } from "loveops-policy/dist/engines/matching/MatchingEngine";
import { CoachingEngine } from "loveops-policy/dist/engines/coaching/CoachingEngine";
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

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      name: "loveops-interface",
      version: "0.1.0",
      description: "APIs and UI that expose the world model and policy",
      endpoints: {
        user: "/api/user",
        matches: "/api/matches",
        coaching: "/api/coaching",
        admin: "/api/admin"
      }
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

