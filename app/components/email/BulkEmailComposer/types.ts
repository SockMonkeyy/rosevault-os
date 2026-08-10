export type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;

  mailing_address_line_1: string | null;
  mailing_address_line_2: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_postal_code: string | null;

  property_address_line_1: string | null;
  property_address_line_2: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
};

export type InitialCampaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_id: string | null;
  status: string;
};