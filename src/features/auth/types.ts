export type Role = "receptionist" | "doctor" | "nurse" | "practice_manager";

export type PracticeSummary = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  currency: string;
  online_booking_enabled: boolean;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
};

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar: string | null;
  role: Role;
  practice: PracticeSummary | null; // null only for platform superusers
  practitioner_id: string | null;   // set when this user is also a bookable doctor
  is_active: boolean;
  date_joined: string;
  push_enabled: boolean;
  email_notifications: boolean;
  is_profile_complete: boolean;
};
