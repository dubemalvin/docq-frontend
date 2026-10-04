import {useParams} from "react-router";
import {UserRound} from "lucide-react";
import {ApiError} from "@/lib/api";
import {PageHeader} from "@/components/PageHeader";
import ProfileForm from "@/features/practitioners/ProfileForm";
import {usePractitionerProfile, useProfileEditor} from "@/features/practitioners/profile";

const BACK = "/settings/practitioners";

export default function PractitionerProfilePage() {
    const {id = ""} = useParams();
    const profile = usePractitionerProfile(id);
    const editor = useProfileEditor(`/practitioners/${id}/`);

    if (profile.isLoading) {
        return (
            <div className="flex flex-col gap-3 lg:h-full">
                <div className="h-12 w-64 animate-pulse rounded-sm bg-slate-200"/>
                <div className="grid gap-3 xl:flex-1 xl:grid-cols-3">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="h-48 animate-pulse rounded-sm bg-slate-200 xl:h-auto"/>
                    ))}
                </div>
            </div>
        );
    }

    if (profile.isError || !profile.data) {
        const notFound = profile.error instanceof ApiError && profile.error.status === 404;
        return (
            <div className="space-y-3">
                <PageHeader icon={UserRound} title="Practitioner" backHref={BACK}/>
                <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {notFound ? "Practitioner not found." : "Couldn't load this profile."}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 lg:h-full">
            <div className="shrink-0">
                <PageHeader
                    icon={UserRound}
                    title={profile.data.display_name}
                    subtitle="Their profile on the online booking page. They can also edit it under “My profile”."
                    backHref={BACK}
                />
            </div>
            <ProfileForm
                profile={profile.data}
                photoPath={`/practitioners/${id}/photo/`}
                isSelf={false}
                className="lg:h-auto lg:flex-1"
                {...editor}
            />
        </div>
    );
}