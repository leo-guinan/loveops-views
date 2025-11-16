/**
 * OpenRouter Service
 * LLM API client for document analysis
 */

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = "https://openrouter.ai/api/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey) {
      console.warn("⚠️  OPENROUTER_API_KEY not set. LLM analysis will be disabled.");
    }
  }

  /**
   * Call OpenRouter API with a specific model
   */
  async chat(
    model: string,
    messages: OpenRouterMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://loveops.app",
          "X-Title": process.env.OPENROUTER_X_TITLE || "LoveOps",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenRouter");
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error calling OpenRouter:", error);
      throw error;
    }
  }

  /**
   * Extract JSON from LLM response (handles markdown code blocks)
   */
  extractJSON(response: string): any {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (error) {
        console.warn("Failed to parse JSON from code block:", error);
      }
    }

    // Try to find JSON object directly
    const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (error) {
        console.warn("Failed to parse JSON object:", error);
      }
    }

    // Fallback: return as text
    return { text: response };
  }
}

