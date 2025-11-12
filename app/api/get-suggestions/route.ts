import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, context } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "input_required",
          suggestions: [],
        },
        { status: 400 },
      );
    }

    const contextStr =
      context
        ?.slice(-3)
        ?.map(
          (msg: any) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
        )
        .join("\n") || "";

    const hasIpKeyword = /\b(ip|asset|nft|search|find|cari)\b/i.test(input);

    let suggestionPrompt = "";
    if (!hasIpKeyword) {
      suggestionPrompt = `You are a helpful AI assistant for searching IP (Intellectual Property) assets on Story Protocol.

User is typing: "${input}"

The user hasn't mentioned IP/assets yet. Provide 3 suggestions that add "ip" or "search ip" to their message to make it an IP asset search.

Rules:
- Each suggestion should be SHORT (max 10 words)
- ALWAYS include "ip" or "search ip" in the suggestions
- Make them natural and relevant to the input
- Return ONLY a JSON array of 3 strings, nothing else

Example: User types "dragon" → ["search ip dragon", "find ip dragon artwork", "show me ip dragon"]`;
    } else {
      suggestionPrompt = `You are a helpful AI assistant for searching IP assets on Story Protocol.

User is typing: "${input}"

Provide 3 helpful suggestions to complete or improve their IP asset search message.
Suggestions could be:
- Completing their search (e.g., "search ip dragon" → "search ip dragon artwork")
- Adding media type filters (e.g., "search dragon" → "search ip dragon video", "search ip dragon image")
- Related searches (e.g., "dragon" → "dragon NFT", "dragon animation")

Rules:
- Each suggestion should be SHORT (max 10 words)
- Try to include media types (image, video, audio) when relevant
- Return ONLY a JSON array of 3 strings, nothing else

Example format:
["search ip dragon image", "find ip dragon video", "search ip dragon artwork"]`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: suggestionPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const responseText = response.choices[0]?.message?.content?.trim() || "[]";

    let suggestions: string[] = [];
    try {
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonText);
      suggestions = Array.isArray(parsed)
        ? parsed.filter((s: any) => typeof s === "string").slice(0, 3)
        : [];
    } catch (parseError) {
      console.warn("Failed to parse suggestions response:", responseText);
      suggestions = [];
    }

    return NextResponse.json({
      ok: true,
      suggestions: suggestions,
    });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "suggestions_error",
        suggestions: [],
      },
      { status: 500 },
    );
  }
}
