import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api} from "@/lib/api";
import {flattenServerErrors} from "@/lib/forms";
import {resizeImage} from "@/features/patients/photo";

export type Option = { value: string; label: string };
export type ProfileOptions = { genders: Option[]; disciplines: Option[]; languages: Option[] };
export type Gender = "F" | "M" | "O" | "U";
export type Qualification = { degree: string; institution: string; year: number | null };

export type PractitionerProfile = {
    id: string;
    display_name: string;
    title: string;
    specialty: string; // free-text headline, e.g. "Family doctor"
    gender: Gender;
    discipline: string;
    discipline_label: string;
    languages_fluent: string[]; // language codes
    languages_conversational: string[];
    special_interests: string[];
    tagline: string;
    biography: string;
    qualifications: Qualification[];
    practising_since: number | null;
    years_experience: number | null;
    accepts_new_patients: boolean;
    show_profile_publicly: boolean;
    has_photo: boolean;
    photo_updated_at: string | null;
};

/** The fields a doctor (or the manager) can change. */
export type ProfileInput = Pick<
    PractitionerProfile,
    | "title" | "specialty" | "gender" | "discipline" | "languages_fluent" | "languages_conversational"
    | "special_interests" | "tagline" | "biography" | "qualifications" | "practising_since"
    | "accepts_new_patients" | "show_profile_publicly"
>;

export function useProfileOptions() {
    return useQuery({
        queryKey: ["practitioners", "options"],
        queryFn: () => api<ProfileOptions>("/practitioners/options/"),
        staleTime: Infinity,
    });
}

export function useMyProfile() {
    return useQuery({
        queryKey: ["practitioners", "me"],
        queryFn: () => api<PractitionerProfile>("/practitioners/me/"),
        retry: false, // a 404 means "your login isn't linked to a practitioner", retrying won't change that
    });
}

/** `path` is "/practitioners/me/" for a doctor, or "/practitioners/<id>/" for a manager. */
export function useSaveProfile(path: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ProfileInput) => api<PractitionerProfile>(path, {method: "PATCH", body: input}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ["practitioners"]}),
    });
}

/** `photoPath` is "/practitioners/me/photo/" or "/practitioners/<id>/photo/". */
export function useProfilePhoto(photoPath: string) {
    const queryClient = useQueryClient();
    const refresh = () => queryClient.invalidateQueries({queryKey: ["practitioners"]});
    const upload = useMutation({
        mutationFn: async (file: File) => {
            const form = new FormData();
            form.append("file", await resizeImage(file, 800), "photo.jpg");
            return api(photoPath, {method: "POST", body: form});
        },
        onSuccess: refresh,
    });
    const remove = useMutation({
        mutationFn: () => api(photoPath, {method: "DELETE"}),
        onSuccess: refresh,
    });
    return {upload, remove};
}

/** A single practitioner's profile, for the practice manager. */
export function usePractitionerProfile(id: string) {
    return useQuery({
        queryKey: ["practitioners", "profile", id],
        queryFn: () => api<PractitionerProfile>(`/practitioners/${id}/`),
        enabled: Boolean(id),
    });
}

/** Save + error handling shared by "My profile" and the manager's profile page. */
export function useProfileEditor(path: string) {
    const save = useSaveProfile(path);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saved, setSaved] = useState(false);

    function onSave(input: ProfileInput) {
        setError(null);
        setFieldErrors({});
        setSaved(false);
        save.mutate(input, {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            },
            onError: (e) => {
                const {detail, ...fields} = flattenServerErrors(e);
                setFieldErrors(fields);
                setError(detail ?? (Object.keys(fields).length ? "Please fix the highlighted fields." : e.message));
            },
        });
    }

    return {onSave, saving: save.isPending, saved, error, fieldErrors};
}