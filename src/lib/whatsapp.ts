import type { WhatsappContact } from "@/lib/types";

// Up to 4 contacts: WHATSAPP_NUMBER / WHATSAPP_NAME plus
// WHATSAPP_NUMBER_2..4 / WHATSAPP_NAME_2..4. Unset numbers are skipped.
export function getWhatsappContacts(): WhatsappContact[] {
  const contacts: WhatsappContact[] = [];
  for (const i of [1, 2, 3, 4]) {
    const suffix = i === 1 ? "" : `_${i}`;
    const number = process.env[`WHATSAPP_NUMBER${suffix}`]?.trim();
    if (!number) continue;
    const name = process.env[`WHATSAPP_NAME${suffix}`]?.trim() || `WhatsApp ${i}`;
    contacts.push({ name, number });
  }
  return contacts;
}
