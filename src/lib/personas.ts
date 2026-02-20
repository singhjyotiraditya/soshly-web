import type { Persona } from "./constants";

/** Crew personas shown on reveal screen (based on max interest match) */
export const CREW_IDS = ["IZU", "SHIVY", "SAMMY"] as const;
export type CrewPersonaId = (typeof CREW_IDS)[number];

/** Floating emojis per crew – one per corner around the character. Edit here to change emojis. */
export const CREW_FLOATING_EMOJIS: Record<CrewPersonaId, readonly string[]> = {
  IZU: ["🌸", "😍", "🥙", "🏕️"],
  SHIVY: ["💬", "❤️", "👥", "✨"],
  SAMMY: ["🎮", "⛰️", "⚽", "🔥"],
};

export interface CrewPersona {
  id: CrewPersonaId;
  name: string;
  quote: string;
  imageUrl: string;
}

export const CREW_PERSONAS: Record<CrewPersonaId, CrewPersona> = {
  IZU: {
    id: "IZU",
    name: "IZU",
    quote:
      "You're always chasing the <b>next thrill. New eats, new faces, new flows.</b> Every event's your ticket to explore.",
    imageUrl: "/personas/izu.png",
  },
  SHIVY: {
    id: "SHIVY",
    name: "SHIVY",
    quote:
      "You thrive when convos hit <b>deep and fam turns into chosen crew.</b> Every hangout's about bonds that stick.",
    imageUrl: "/personas/shivy.png",
  },
  SAMMY: {
    id: "SAMMY",
    name: "SAMMY",
    quote:
      "You bring the heat to any scene. <b>Game nights, hikes, or sports.</b> You turn moments into epic, buzzing memories.",
    imageUrl: "/personas/sammy.png",
  },
};

/** Map onboarding Persona (max interest category) to crew persona for reveal screen.
 *  Distributed 1:2:2 to avoid IZU overload (Explorer moved to SAMMY for balance). */
export function getCrewPersonaFromPersona(persona: Persona): CrewPersonaId {
  switch (persona) {
    case "Foodie":
      return "IZU";
    case "Local Guide":
    case "Creator":
      return "SHIVY";
    case "Explorer":
    case "Chill Planner":
    default:
      return "SAMMY";
  }
}

const INTEREST_TO_CATEGORY: Record<string, string> = {
  restaurants: "food",
  cafes: "food",
  "street food": "food",
  bars: "food",
  "new places": "explore",
  events: "explore",
  "social events": "explore",
  nightlife: "explore",
  "building lists": "creator",
  "posting photos": "creator",
  curating: "creator",
  hosting: "guide",
  "local spots": "guide",
  community: "guide",
  chill: "chill",
  "saving places": "chill",
  occasional: "chill",
};

/** Persona for each category */
const CATEGORY_TO_PERSONA: Record<string, Persona> = {
  food: "Foodie",
  explore: "Explorer",
  creator: "Creator",
  guide: "Local Guide",
  chill: "Chill Planner",
};

const CATEGORY_ORDER = [
  "food",
  "explore",
  "creator",
  "guide",
  "chill",
] as const;

export function computePersonaFromInterests(interests: string[]): Persona {
  const counts: Record<string, number> = {
    food: 0,
    explore: 0,
    creator: 0,
    guide: 0,
    chill: 0,
  };
  for (const interest of interests) {
    const key = interest.toLowerCase().trim();
    const cat = INTEREST_TO_CATEGORY[key] ?? "chill";
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  const max = Math.max(...Object.values(counts));
  if (max === 0) return "Chill Planner";

  const tied: string[] = CATEGORY_ORDER.filter((c) => counts[c] === max);
  if (tied.length === 0) return "Chill Planner";

  if (tied.length === 1) {
    return CATEGORY_TO_PERSONA[tied[0]];
  }

  const lastInterest = interests[interests.length - 1];
  const lastCat =
    lastInterest != null
      ? (INTEREST_TO_CATEGORY[lastInterest.toLowerCase().trim()] ?? "chill")
      : null;
  const winner = lastCat && tied.includes(lastCat) ? lastCat : tied[0];
  return CATEGORY_TO_PERSONA[winner];
}

export const ONBOARDING_INTERESTS = [
  "restaurants",
  "cafes",
  "street food",
  "new places",
  "events",
  "social events",
  "building lists",
  "posting photos",
  "hosting",
  "local spots",
  "chill",
  "saving places",
];

/** Vibe cards for swipe onboarding: images from public/cards/ */
export const VIBE_CARDS: { id: string; label: string; imageUrl: string }[] = [
  { id: "events", label: "Party, Raves etc", imageUrl: "/cards/card1.png" },
  {
    id: "restaurants",
    label: "Restaurants & dining",
    imageUrl: "/cards/card2.png",
  },
  { id: "cafes", label: "Cafes & coffee", imageUrl: "/cards/card3.png" },
  { id: "street food", label: "Street food", imageUrl: "/cards/card4.png" },
  {
    id: "new places",
    label: "New places & explore",
    imageUrl: "/cards/card5.png",
  },
  { id: "social events", label: "Social events", imageUrl: "/cards/card6.png" },
  {
    id: "building lists",
    label: "Building lists",
    imageUrl: "/cards/card7.png",
  },
  {
    id: "posting photos",
    label: "Posting photos",
    imageUrl: "/cards/card8.png",
  },
  { id: "hosting", label: "Hosting", imageUrl: "/cards/card9.png" },
  { id: "local spots", label: "Local spots", imageUrl: "/cards/card10.png" },
  { id: "chill", label: "Chill", imageUrl: "/cards/card11.png" },
  {
    id: "saving places",
    label: "Saving places",
    imageUrl: "/cards/card11.png",
  },
];
