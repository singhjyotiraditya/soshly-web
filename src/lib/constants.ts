export const PERSONAS = [
  "Explorer",
  "Foodie",
  "Creator",
  "Local Guide",
  "Chill Planner",
] as const;

export type Persona = (typeof PERSONAS)[number];

export const EXPERIENCE_STATUSES = [
  "draft",
  "published",
  "full",
  "started",
  "completed",
  "cancelled",
] as const;

export type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number];

export const SIGNUP_BONUS_COINS = 500;
export const SESSION_COOKIE_MAX_AGE_DAYS = 10;
export const SESSION_COOKIE_NAME = "soshly_session";
