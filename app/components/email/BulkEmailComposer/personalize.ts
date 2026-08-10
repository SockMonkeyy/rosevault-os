import { Contact } from "./types";

export function personalizeText(
  text: string,
  contact: Contact,
) {
  const fullName = [
    contact.first_name,
    contact.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const mailingAddress = formatAddress([
    contact.mailing_address_line_1,
    contact.mailing_address_line_2,
    contact.mailing_city,
    contact.mailing_state,
    contact.mailing_postal_code,
  ]);

  const propertyAddress = formatAddress([
    contact.property_address_line_1,
    contact.property_address_line_2,
    contact.property_city,
    contact.property_state,
    contact.property_postal_code,
  ]);

  return text
    .replaceAll("{{first_name}}", contact.first_name ?? "")
    .replaceAll("{{last_name}}", contact.last_name ?? "")
    .replaceAll("{{full_name}}", fullName)
    .replaceAll("{{email}}", contact.email ?? "")
    .replaceAll("{{mailing_address}}", mailingAddress)
    .replaceAll("{{property_address}}", propertyAddress);
}

function formatAddress(
  parts: Array<string | null | undefined>,
) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}