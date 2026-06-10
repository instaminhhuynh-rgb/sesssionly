/**
 * Location & directions helpers.
 *
 * These are all free deep links — no Maps API key, no per-request cost. They
 * open the user's own maps app. Live-traffic ETAs and travel buffers (Phase 2)
 * would use the Google Maps Platform and get gated behind a paid tier.
 */

export type LocationType = "inperson" | "virtual" | "phone";

/** Universal Google Maps directions link (opens the app or web on any device). */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
export function appleMapsUrl(address: string): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
}
export function wazeUrl(address: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

/** Pre-filled SMS. iOS and Android both accept this form. */
export function smsHref(body: string): string {
  return `sms:?&body=${encodeURIComponent(body)}`;
}

export function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/** Best-guess the kind of location from a free-text value. */
export function detectLocation(value: string): { type: LocationType; value: string } {
  const s = value.trim();
  if (isUrl(s) || /\b(zoom|meet|teams|webex|hangout|skype)\b/i.test(s)) return { type: "virtual", value: s };
  if (/^[+()\-\d\s.]{7,}$/.test(s)) return { type: "phone", value: s };
  return { type: "inperson", value: s };
}
