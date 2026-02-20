import type { GeoPoint } from "firebase/firestore";
import type { Experience } from "@/types";
import type { Persona } from "./constants";

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function rankExperiences(
  experiences: Experience[],
  options: {
    userGeo?: GeoPoint | null;
    userPersona?: Persona | null;
  }
): Experience[] {
  const { userGeo } = options;
  const sorted = [...experiences].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    const timeSoon = timeA - timeB;
    if (timeSoon !== 0) return timeSoon;

    if (userGeo && a.location?.geo && b.location?.geo) {
      const lat = userGeo.latitude;
      const lng = userGeo.longitude;
      const distA = haversineKm(
        lat,
        lng,
        a.location.geo.latitude,
        a.location.geo.longitude
      );
      const distB = haversineKm(
        lat,
        lng,
        b.location.geo.latitude,
        b.location.geo.longitude
      );
      return distA - distB;
    }

    const seatsTakenA = a.maxParticipants - a.seatsRemaining;
    const seatsTakenB = b.maxParticipants - b.seatsRemaining;
    return seatsTakenB - seatsTakenA;
  });
  return sorted;
}
