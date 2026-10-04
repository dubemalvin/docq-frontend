import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api} from "@/lib/api";

export type PublicLanguage = { code: string; label: string };
export type PublicQualification = { degree: string; institution: string; year: number | null };

/** The profile fields only exist when the doctor opted in (has_profile = true). */
export type PublicPractitioner = {
    id: string;
    display_name: string;
    specialty: string;
    color: string;
    has_profile: boolean;
    gender?: "F" | "M" | "O" | null;
    discipline?: string;
    discipline_label?: string;
    languages_fluent?: PublicLanguage[];
    languages_conversational?: PublicLanguage[];
    special_interests?: string[];
    tagline?: string;
    biography?: string;
    qualifications?: PublicQualification[];
    years_experience?: number | null;
    accepts_new_patients?: boolean;
    photo_url?: string | null;
};

export type PublicPractice = {
    practice: {
        name: string;
        slug: string;
        logo: string | null;
        phone: string;
        address: string;
        timezone: string;
        booking_max_days_ahead: number;
        booking_min_notice_hours: number;
    };
    practitioners: PublicPractitioner[];
    appointment_types: { id: string; name: string; duration_minutes: number; price: string }[];
};

export type SlotDay = { date: string; slots: string[] }; // slots are ISO strings in the PRACTICE's timezone

export function usePublicPractice(slug: string) {
    return useQuery({
        queryKey: ["public", "practice", slug],
        queryFn: () => api<PublicPractice>(`/public/practices/${slug}/`),
        retry: false,
    });
}

export function useSlots(slug: string, practitioner: string, appointmentType: string, start: string, end: string) {
    return useQuery({
        queryKey: ["public", "slots", slug, practitioner, appointmentType, start, end],
        queryFn: () =>
            api<SlotDay[]>(
                `/public/practices/${slug}/slots/?${new URLSearchParams({
                    practitioner, appointment_type: appointmentType, start, end,
                })}`,
            ),
        enabled: Boolean(practitioner && appointmentType),
        staleTime: 15_000, // slots disappear as others book, so keep them fresh
    });
}

export type BookingInput = {
    practitioner: string;
    appointment_type: string;
    start_at: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    reason: string;
    consent: boolean;
    whatsapp_opt_in: boolean;
    // Only sent when the patient chose medical aid
    medical_aid_name?: string;
    medical_aid_number?: string;
    medical_aid_dependant_code?: string;
    medical_aid_main_member?: string;
};

export type BookingResult = {
    token: string; // the patient's private key to confirm/cancel later
    status: string;
    start_at: string; // ISO in the practice's timezone
    end_at: string;
    practitioner: string;
    appointment_type: string;
    practice_name: string;
    practice_phone: string;
    practice_address: string;
    can_change: boolean;
};

export function useBook(slug: string) {
    return useMutation({
        mutationFn: (input: BookingInput) =>
            api<BookingResult>(`/public/practices/${slug}/book/`, {method: "POST", body: input}),
    });
}

// The server returns the same patient-safe shape as a fresh booking
export type PublicAppointment = BookingResult;

export function useManagedAppointment(token: string) {
    return useQuery({
        queryKey: ["public", "appointment", token],
        queryFn: () => api<PublicAppointment>(`/public/appointments/${token}/`),
        retry: false,
    });
}

export function usePatientAction(token: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (action: "confirm" | "cancel") =>
            api<PublicAppointment>(`/public/appointments/${token}/${action}/`, {method: "POST"}),
        onSuccess: (data) => queryClient.setQueryData(["public", "appointment", token], data),
    });
}