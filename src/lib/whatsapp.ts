/** Normalize Algerian/mobile numbers for wa.me (digits only, without +). */
export function normalizePhonesForWa(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `213${digits.slice(1)}`;
  if (digits.length >= 8) return digits;
  return digits;
}

export function whatsappHref(phone: string, message: string): string {
  const num = normalizePhonesForWa(phone.trim());
  if (!num) return "#";
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
