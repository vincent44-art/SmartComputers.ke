export const WHATSAPP_NUMBER_E164 = "+254792758560";

function normalizePhone(phoneE164: string): string {
  return phoneE164.replace(/^\+/, "").replace(/\s+/g, "");
}

export function buildWhatsAppUrl(text: string, phoneE164: string = WHATSAPP_NUMBER_E164): string {
  const phone = normalizePhone(phoneE164);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function formatWhatsAppMoney(amount: number): string {
  // The app already formats KSh in UI; for WhatsApp we keep it simple and stable.
  // If your backend uses a different currency/format, adjust here.
  return `KSh ${amount.toFixed(2)}`;
}

