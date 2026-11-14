import type { Lead, FoundPlace } from "./types";
const clean = (s?: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** Conservative: never merge branches on shared phone/domain alone. */
export function sameBusiness(a: Lead | FoundPlace, b: Lead | FoundPlace) {
  if (a.id === b.id) return true;
  if (!clean(a.name) || clean(a.name) !== clean(b.name)) return false;
  const phoneA = (a.phoneE164 || a.phone || "").replace(/\D/g, "");
  const phoneB = (b.phoneE164 || b.phone || "").replace(/\D/g, "");
  return phoneA.length >= 10 && phoneA === phoneB && !!clean(a.address) && clean(a.address) === clean(b.address);
}
