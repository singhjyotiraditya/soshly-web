import { AzureOpenAI } from "openai";
import { NextResponse } from "next/server";

const endpoint = "https://clinexa.openai.azure.com/";
const deployment = "gpt-4.1-nano";
const apiVersion = "2024-12-01-preview";

type RequestBody = {
  tasteListContext?: string;
  tasteList?: {
    name: string;
    description?: string;
    places?: Array<{
      name: string;
      address?: string;
      lat?: number | null;
      lng?: number | null;
      note?: string;
    }>;
  };
};

export async function POST(request: Request) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Azure OpenAI not configured" },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment,
    apiVersion,
  });

  let userContent: string;
  let responseShape: string;

  if (body.tasteList) {
    const { tasteList } = body;
    const places = (tasteList.places ?? []).map((p) => ({
      name: p.name,
      address: p.address ?? "",
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      note: p.note ?? "",
    }));

    const hasPlaces = places.length > 0;
    const hasLocations = places.some((p) => p.lat !== null && p.lng !== null);
    const placesJson = JSON.stringify(places, null, 2);

    userContent = `Generate exactly 1 social experience concept based on the following taste list. Be creative and out-of-the-box: surprise people with unusual angles, memorable themes, or unexpected twists that still fit the venue.

Taste List Name: ${tasteList.name}
Description: ${tasteList.description || "N/A"}

Available places (use ONLY these exact names and coordinates – do NOT invent places):
${hasPlaces ? placesJson : "No places available."}

RULES:
- Generate exactly ONE experience.
- You MUST pick one of the places listed above as the "location" for the experience. Use its exact name and exact lat/lng values.
${!hasPlaces ? '- There are no places, so set location to "", latitude to 0, longitude to 0.' : ""}
${hasPlaces && !hasLocations ? "- The places have no coordinates, so set latitude to 0 and longitude to 0 while still using the place name." : ""}
- The experience must be an activity that realistically fits the type of venue. Think about the physical space and surprise with a unique angle (e.g. not just "coffee tasting" but "Blind coffee duel: guess the origin", or a picnic with a specific theme).
- Vary title, startTime, duration, and capacity each time: use different titles, time slots (morning/afternoon/evening), durations (e.g. 60–240 min), and group sizes (4–12) so regenerations feel fresh.
- CRITICAL: whatsIncluded, whatYoullDo, and vibeKeywords MUST start each string with a real Unicode emoji character. Examples: "☕ Coffee flight", "🍰 House dessert", "👋 Intros and order", "📍 Social". Never use plain text without an emoji prefix.
- whatsIncluded: 3–5 strings, each MUST begin with an emoji (e.g. "☕ Coffee flight", "🍰 House dessert", "🎵 Curated playlist"). Use different emojis.
- whatYoullDo: 4–8 strings, each MUST begin with an emoji (e.g. "👋 Intros and order", "☕ Blind tasting round", "🗳️ Vote on favourites", "📸 Group photo"). Different emoji per step.
- vibeKeywords: 3–5 strings, each MUST begin with an emoji (e.g. "🌟 Social", "😌 Chill", "🎮 Playful").
- costPerPerson: estimated cost in coins per person. Must be at least 1000 (minimum 1000 INR equivalent). Use 0 only for explicitly free experiences.

Return a JSON object with this exact structure. Use REAL emoji characters (☕🍰🎵👋📍 etc.), never placeholder text:
{
  "experience": {
    "title": "Unique, engaging title (vary on each generation)",
    "purpose": "Clear purpose of the meetup",
    "description": "Description of what will happen at that specific place",
    "startTime": "A suggested future ISO 8601 date string (vary time of day and day)",
    "duration": <number in minutes, vary between 60–240>,
    "location": "<exact place name from the list above, or empty string>",
    "latitude": <number from the place, or 0>,
    "longitude": <number from the place, or 0>,
    "capacity": <number between 4-12, vary>,
    "costPerPerson": <estimated cost in coins per person, minimum 1000 or 0 if free>,
    "whatsIncluded": ["☕ Coffee flight", "🍰 House dessert", "🎵 Curated playlist"],
    "whatYoullDo": ["👋 Intros and order", "☕ Blind tasting round", "🗳️ Vote on favourites", "📸 Group photo"],
    "inviteType": "ANYONE",
    "vibeKeywords": ["🌟 Social", "😌 Chill", "🎮 Playful"],
    "whatToBring": "Optional items to bring",
    "hostNote": "Optional note from host"
  }
}`;
    responseShape = "experience";
  } else {
    // Legacy: simple tasteListContext string
    userContent = `Generate experience fields. TasteList context: ${body.tasteListContext ?? "none"}`;
    responseShape = "legacy";
  }

  const systemContent =
    responseShape === "experience"
      ? "You suggest creative social experience concepts. Respond with valid JSON only. No markdown, no code blocks. IMPORTANT: Every string in whatsIncluded, whatYoullDo, and vibeKeywords MUST begin with a real emoji character (e.g. ☕ 🍰 👋 📍). Never omit emojis."
      : "You suggest experience details for a local event host. Respond with valid JSON only: { title, description, subtitle (venue/place name), agenda (bullet points, one per line), durationMinutes, meetingPoint, maxParticipants, coinPrice, startTimeOptions (array of strings), whatToBring, rules, tags (array of 2-4 short mood words e.g. Social, Chill, Playful) }.";

  try {
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      max_completion_tokens: 13107,
      temperature: 1.0,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "No content from model" },
        { status: 502 }
      );
    }

    const parsed = parseJSONFromContent(raw);

    if (responseShape === "experience" && parsed.experience) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Azure OpenAI error:", err);
    return NextResponse.json(
      { error: "Experience generation failed" },
      { status: 502 }
    );
  }
}

function parseJSONFromContent(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  }
  return { raw: content };
}
