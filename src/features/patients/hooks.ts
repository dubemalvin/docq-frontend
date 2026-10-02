import {api} from "@/lib/api";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {Page} from "@/lib/types";

export type PatientListItem = {
    id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    id_number: string;
    date_of_birth: string | null;
    age: number | null;
    phone: string;
    email: string;
    is_active: boolean;
};

export type PatientInput = {
    first_name: string;
    last_name: string;
    id_number: string;
    date_of_birth: string | null;
    sex: "F" | "M" | "O" | "U";
    phone: string;
    email: string;
    address: string;
    medical_aid_name: string;
    medical_aid_number: string;
    medical_aid_dependant_code: string;
    next_of_kin_name: string;
    next_of_kin_phone: string;
    allergies: string;
    chronic_conditions: string;
    current_medication: string;
    whatsapp_opt_in: boolean;
    sms_opt_in: boolean;
    email_opt_in: boolean;
    marketing_opt_in: boolean;
    consent_given: boolean;
};

export function useCreatePatient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: PatientInput) => api<PatientListItem>("/patients/", {method: "POST", body: input}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ["patients"]}),
    });
}

export function usePatients(search: string, page: number) {
    return useQuery({
        queryKey: ["patients", {search, page}],
        queryFn: () => api<Page<PatientListItem>>(`/patients/?${new URLSearchParams({search, page: String(page)})}`),
        placeholderData: keepPreviousData, // keeps the old rows on screen while the next search loads
    });
}

export type PatientDetail = PatientListItem & {
    sex: "F" | "M" | "O" | "U";
    address: string;
    // Absent for receptionists: the backend never sends clinical fields to them
    allergies?: string;
    chronic_conditions?: string;
    current_medication?: string;
    medical_aid_name: string;
    medical_aid_number: string;
    medical_aid_dependant_code: string;
    next_of_kin_name: string;
    next_of_kin_phone: string;
    consent_given_at: string | null;
    whatsapp_opt_in: boolean;
    sms_opt_in: boolean;
    email_opt_in: boolean;
    marketing_opt_in: boolean;
    created_at: string;
    updated_at: string;
};

export function usePatient(id: string | undefined) {
    return useQuery({
        queryKey: ["patients", "detail", id],
        queryFn: () => api<PatientDetail>(`/patients/${id}/`),
        enabled: Boolean(id),
    });
}