/**
 * Document Analysis Service
 * Extracts compatibility insights from uploaded documents using OpenRouter LLM
 */

import { OpenRouterService } from "./OpenRouterService";

export interface CompatibilityInsights {
  emotionalRhythm: string;
  communication: string;
  preferences: string;
}

export interface ProfileInsights {
  compatibility: CompatibilityInsights;
  sparkIntro?: string;
  archetype?: {
    title: string;
    traits: string[];
  };
  finalReport?: string; // Combined synthesis report
}

export class DocumentAnalysisService {
  private openRouter: OpenRouterService;
  
  // Configurable models for each analysis piece
  private emotionalRhythmModel: string;
  private communicationModel: string;
  private preferencesModel: string;
  private sparkIntroModel: string;
  private archetypeModel: string;
  private synthesisModel: string;

  constructor() {
    this.openRouter = new OpenRouterService();
    
    // Load model configurations from environment
    this.emotionalRhythmModel = process.env.ANALYSIS_MODEL_EMOTIONAL_RHYTHM || 
      process.env.ANALYSIS_MODEL_DEFAULT || "anthropic/claude-3.5-sonnet";
    this.communicationModel = process.env.ANALYSIS_MODEL_COMMUNICATION || 
      process.env.ANALYSIS_MODEL_DEFAULT || "anthropic/claude-3.5-sonnet";
    this.preferencesModel = process.env.ANALYSIS_MODEL_PREFERENCES || 
      process.env.ANALYSIS_MODEL_DEFAULT || "anthropic/claude-3.5-sonnet";
    this.sparkIntroModel = process.env.ANALYSIS_MODEL_SPARK_INTRO || 
      process.env.ANALYSIS_MODEL_DEFAULT || "anthropic/claude-3.5-sonnet";
    this.archetypeModel = process.env.ANALYSIS_MODEL_ARCHETYPE || 
      process.env.ANALYSIS_MODEL_DEFAULT || "anthropic/claude-3.5-sonnet";
    this.synthesisModel = process.env.ANALYSIS_MODEL_SYNTHESIS || 
      process.env.ANALYSIS_MODEL_DEFAULT || "anthropic/claude-3.5-sonnet";
  }

  /**
   * Analyze a document and extract compatibility insights using LLM
   */
  async analyzeDocument(documentText: string): Promise<ProfileInsights> {
    // Decode base64 if needed (check if it looks like base64)
    let text = documentText;
    
    // Check if text looks like base64 (contains only base64 chars and is reasonably long)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    const looksLikeBase64 = base64Regex.test(documentText.trim()) && documentText.length > 100;
    
    if (looksLikeBase64) {
      try {
        const decoded = Buffer.from(documentText, 'base64').toString('utf-8');
        // Verify it decoded to something readable (contains letters/spaces)
        if (decoded && decoded.length > 0 && /[a-zA-Z\s]/.test(decoded)) {
          text = decoded;
          console.log(`✅ Decoded base64 document (${documentText.length} → ${text.length} chars)`);
        } else {
          console.warn(`⚠️  Base64 decode produced non-readable text, using as-is`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to decode base64, using as-is:`, error);
        // Not base64, use as-is
        text = documentText;
      }
    } else {
      // Already decoded or plain text
      text = documentText;
    }
    
    // Validate we have readable text
    if (!text || text.trim().length < 10) {
      throw new Error("Document text is too short or empty");
    }
    
    console.log(`📄 Analyzing document (${text.length} chars, preview: ${text.substring(0, 100)}...)`);

    // If OpenRouter is not configured, fall back to pattern matching
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️  OpenRouter not configured, using pattern matching fallback");
      return this.analyzeWithPatternMatching(text);
    }

    try {
      // Analyze each piece in parallel
      const [emotionalRhythm, communication, preferences, sparkIntro, archetype] = await Promise.all([
        this.analyzeEmotionalRhythm(text),
        this.analyzeCommunication(text),
        this.analyzePreferences(text),
        this.analyzeSparkIntro(text),
        this.analyzeArchetype(text),
      ]);

      // Combine all insights into final report
      const finalReport = await this.synthesizeReport({
        emotionalRhythm,
        communication,
        preferences,
        sparkIntro,
        archetype,
      });

      return {
        compatibility: {
          emotionalRhythm,
          communication,
          preferences,
        },
        sparkIntro,
        archetype,
        finalReport,
      };
    } catch (error) {
      console.error("Error analyzing document with LLM:", error);
      // Fallback to pattern matching
      return this.analyzeWithPatternMatching(text);
    }
  }

  /**
   * Analyze emotional rhythm using LLM
   */
  private async analyzeEmotionalRhythm(text: string): Promise<string> {
    const prompt = `You are analyzing a "date me" document to understand someone's emotional rhythm in relationships.

Document:
${text.substring(0, 4000)}${text.length > 4000 ? '...' : ''}

Analyze their emotional rhythm: How do they move through relationships? What's their pace? Do they prefer depth or novelty? Steady or dynamic?

Respond with a single, insightful sentence (2-3 sentences max) that captures their emotional rhythm in relationships. Be specific and accurate based on what they've written.`;

    const response = await this.openRouter.chat(
      this.emotionalRhythmModel,
      [
        {
          role: "system",
          content: "You are an expert relationship analyst who extracts insights from personal documents. Be concise, accurate, and insightful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      { temperature: 0.7, max_tokens: 200 }
    );

    return response;
  }

  /**
   * Analyze communication style using LLM
   */
  private async analyzeCommunication(text: string): Promise<string> {
    const prompt = `You are analyzing a "date me" document to understand someone's communication style.

Document:
${text.substring(0, 4000)}${text.length > 4000 ? '...' : ''}

Analyze their communication style: How do they express themselves? Are they direct or indirect? Do they value clarity, warmth, curiosity? Are they listeners or talkers?

Respond with a single, insightful sentence (2-3 sentences max) that captures their communication style. Be specific and accurate based on what they've written.`;

    const response = await this.openRouter.chat(
      this.communicationModel,
      [
        {
          role: "system",
          content: "You are an expert relationship analyst who extracts insights from personal documents. Be concise, accurate, and insightful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      { temperature: 0.7, max_tokens: 200 }
    );

    return response;
  }

  /**
   * Analyze preferences using LLM
   */
  private async analyzePreferences(text: string): Promise<string> {
    const prompt = `You are analyzing a "date me" document to understand what kind of people and environments someone thrives with.

Document:
${text.substring(0, 4000)}${text.length > 4000 ? '...' : ''}

Analyze their preferences: What kind of people do they thrive with? What environments? What dynamics? What qualities matter most?

Respond with a single, insightful sentence (2-3 sentences max) that describes who they thrive with. Be specific and accurate based on what they've written.`;

    const response = await this.openRouter.chat(
      this.preferencesModel,
      [
        {
          role: "system",
          content: "You are an expert relationship analyst who extracts insights from personal documents. Be concise, accurate, and insightful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      { temperature: 0.7, max_tokens: 200 }
    );

    return response;
  }

  /**
   * Generate spark intro using LLM
   */
  private async analyzeSparkIntro(text: string): Promise<string> {
    const prompt = `You are creating a "spark intro" - a brief, compelling description of someone based on their "date me" document.

Document:
${text.substring(0, 4000)}${text.length > 4000 ? '...' : ''}

Create a 1-2 sentence "spark intro" that captures their essence. This should feel authentic, warm, and intriguing. It's how you'd introduce them to a potential match.

Example format: "A thoughtful, creative mind who prefers meaningful conversation over small talk, and values emotional stability over spectacle."

Respond with just the spark intro, no explanation.`;

    const response = await this.openRouter.chat(
      this.sparkIntroModel,
      [
        {
          role: "system",
          content: "You are an expert at writing compelling, authentic descriptions of people. Be warm, specific, and intriguing.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      { temperature: 0.8, max_tokens: 150 }
    );

    return response;
  }

  /**
   * Generate archetype using LLM
   */
  private async analyzeArchetype(text: string): Promise<{ title: string; traits: string[] }> {
    const prompt = `You are analyzing a "date me" document to identify someone's relational archetype.

Document:
${text.substring(0, 4000)}${text.length > 4000 ? '...' : ''}

Identify their relational archetype (e.g., "The Introspective Explorer", "The Nurturing Connector", "The Creative Visionary") and list 3-4 key traits that describe them.

Respond with JSON format:
{
  "title": "The Archetype Name",
  "traits": ["trait 1", "trait 2", "trait 3", "trait 4"]
}`;

    const response = await this.openRouter.chat(
      this.archetypeModel,
      [
        {
          role: "system",
          content: "You are an expert at identifying relational archetypes. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      { temperature: 0.7, max_tokens: 200 }
    );

    try {
      const parsed = this.openRouter.extractJSON(response);
      return {
        title: parsed.title || "The Relational Explorer",
        traits: Array.isArray(parsed.traits) ? parsed.traits : parsed.traits?.split(",") || [],
      };
    } catch (error) {
      console.error("Error parsing archetype JSON:", error);
      return {
        title: "The Relational Explorer",
        traits: ["value authentic connection", "appreciate depth", "seek meaningful relationships"],
      };
    }
  }

  /**
   * Synthesize all insights into a final report
   */
  private async synthesizeReport(insights: {
    emotionalRhythm: string;
    communication: string;
    preferences: string;
    sparkIntro: string;
    archetype: { title: string; traits: string[] };
  }): Promise<string> {
    const prompt = `You are synthesizing relationship insights into a cohesive report.

Emotional Rhythm:
${insights.emotionalRhythm}

Communication Style:
${insights.communication}

Preferences:
${insights.preferences}

Spark Intro:
${insights.sparkIntro}

Archetype: ${insights.archetype.title}
Traits: ${insights.archetype.traits.join(", ")}

Create a 3-4 paragraph synthesis report that weaves these insights together into a cohesive narrative about this person's relational style. Make it feel personal, accurate, and insightful. Write in second person ("You...").`;

    const response = await this.openRouter.chat(
      this.synthesisModel,
      [
        {
          role: "system",
          content: "You are an expert relationship analyst who synthesizes insights into compelling, accurate reports. Write in a warm, insightful tone.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      { temperature: 0.8, max_tokens: 500 }
    );

    return response;
  }

  /**
   * Fallback: Pattern matching analysis (used when LLM is not available)
   */
  private analyzeWithPatternMatching(text: string): ProfileInsights {
    const insights = this.extractInsights(text);
    
    return {
      compatibility: insights,
      sparkIntro: this.generateSparkIntro(text),
      archetype: this.generateArchetype(text),
    };
  }

  private extractInsights(text: string): CompatibilityInsights {
    const lowerText = text.toLowerCase();
    
    // Emotional rhythm patterns
    let emotionalRhythm = "You move through relationships with a steady emotional rhythm.";
    if (lowerText.includes("slow") || lowerText.includes("steady") || lowerText.includes("patient")) {
      emotionalRhythm = "You move through relationships with a steady emotional rhythm and a strong preference for depth over novelty.";
    } else if (lowerText.includes("fast") || lowerText.includes("quick") || lowerText.includes("rush")) {
      emotionalRhythm = "You move through relationships with an energetic pace, valuing connection and momentum.";
    } else if (lowerText.includes("depth") || lowerText.includes("meaningful") || lowerText.includes("deep")) {
      emotionalRhythm = "You move through relationships with a steady emotional rhythm and a strong preference for depth over novelty.";
    }

    // Communication patterns
    let communication = "You communicate with clarity and warmth.";
    if (lowerText.includes("clear") || lowerText.includes("direct") || lowerText.includes("honest")) {
      communication = "You communicate with clarity, warmth, and intellectual curiosity.";
    } else if (lowerText.includes("curious") || lowerText.includes("questions") || lowerText.includes("wonder")) {
      communication = "You communicate with clarity, warmth, and intellectual curiosity.";
    } else if (lowerText.includes("listener") || lowerText.includes("listen") || lowerText.includes("hear")) {
      communication = "You communicate with patience and deep listening, valuing understanding over being understood.";
    }

    // Preferences patterns
    let preferences = "You thrive most with people who share your values.";
    if (lowerText.includes("conversation") || lowerText.includes("talk") || lowerText.includes("discuss")) {
      preferences = "You thrive most with people who enjoy slow-burn conversations, shared meaning, and low-pressure environments.";
    } else if (lowerText.includes("quiet") || lowerText.includes("intimate") || lowerText.includes("cozy")) {
      preferences = "You thrive most with people who enjoy intimate, low-noise spaces and meaningful connection.";
    } else if (lowerText.includes("depth") || lowerText.includes("meaning") || lowerText.includes("purpose")) {
      preferences = "You thrive most with people who enjoy slow-burn conversations, shared meaning, and low-pressure environments.";
    } else if (lowerText.includes("stability") || lowerText.includes("steady") || lowerText.includes("consistent")) {
      preferences = "You thrive most with people who value emotional steadiness and consistency over excitement.";
    }

    return {
      emotionalRhythm,
      communication,
      preferences,
    };
  }

  private generateSparkIntro(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("thinker") || lowerText.includes("thoughtful") || lowerText.includes("creative")) {
      return "A thoughtful, creative mind who prefers meaningful conversation over small talk, and values emotional stability over spectacle.";
    } else if (lowerText.includes("warm") || lowerText.includes("kind") || lowerText.includes("gentle")) {
      return "A warm, grounded presence who brings stability and depth to relationships, valuing authentic connection over performance.";
    } else if (lowerText.includes("curious") || lowerText.includes("explore") || lowerText.includes("learn")) {
      return "A curious explorer who loves deep conversations and values intellectual connection alongside emotional intimacy.";
    }
    
    return "A thoughtful, creative mind who prefers meaningful conversation over small talk, and values emotional stability over spectacle.";
  }

  private generateArchetype(text: string): { title: string; traits: string[] } {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("introspect") || lowerText.includes("reflective") || lowerText.includes("depth")) {
      return {
        title: "The Introspective Explorer",
        traits: [
          "communicate with patience",
          "enjoy intimate, low-noise spaces",
          "value emotional clarity",
          "share your depth-first orientation",
        ],
      };
    } else if (lowerText.includes("warm") || lowerText.includes("nurturing") || lowerText.includes("caring")) {
      return {
        title: "The Nurturing Connector",
        traits: [
          "bring warmth and stability",
          "value deep emotional connection",
          "appreciate consistency",
          "share your caring nature",
        ],
      };
    } else if (lowerText.includes("creative") || lowerText.includes("artistic") || lowerText.includes("imaginative")) {
      return {
        title: "The Creative Visionary",
        traits: [
          "value creative expression",
          "enjoy meaningful conversations",
          "appreciate depth and nuance",
          "share your imaginative spirit",
        ],
      };
    }
    
    return {
      title: "The Introspective Explorer",
      traits: [
        "communicate with patience",
        "enjoy intimate, low-noise spaces",
        "value emotional clarity",
        "share your depth-first orientation",
      ],
    };
  }
}
