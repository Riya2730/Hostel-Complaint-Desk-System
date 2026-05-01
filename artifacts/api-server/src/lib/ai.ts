import OpenAI from "openai";
import { logger } from "./logger";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

export interface AIAnalysis {
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  sentiment: "positive" | "neutral" | "negative";
}

const FALLBACK: AIAnalysis = {
  category: "other",
  priority: "medium",
  sentiment: "neutral",
};

export async function analyzeComplaint(title: string, description: string): Promise<AIAnalysis> {
  try {
    const prompt = `You are an AI system that analyzes hostel/campus complaints and classifies them.

Complaint title: "${title}"
Complaint description: "${description}"

Respond with a JSON object (no markdown) with exactly these fields:
- category: one of maintenance, hygiene, food, internet, security, noise, other
- priority: one of low, medium, high, critical (critical = safety/urgent, high = affects daily life, medium = inconvenient, low = minor)
- sentiment: one of positive, neutral, negative

Return only the JSON, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(content) as AIAnalysis;

    const validCategories = ["maintenance", "hygiene", "food", "internet", "security", "noise", "other"];
    const validPriorities = ["low", "medium", "high", "critical"];
    const validSentiments = ["positive", "neutral", "negative"];

    return {
      category: validCategories.includes(parsed.category) ? parsed.category : "other",
      priority: validPriorities.includes(parsed.priority) ? (parsed.priority as AIAnalysis["priority"]) : "medium",
      sentiment: validSentiments.includes(parsed.sentiment) ? (parsed.sentiment as AIAnalysis["sentiment"]) : "neutral",
    };
  } catch (err) {
    logger.warn({ err }, "AI analysis failed, using fallback");
    return FALLBACK;
  }
}
