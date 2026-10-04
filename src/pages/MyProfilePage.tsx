import {User} from "lucide-react";
import {ApiError} from "@/lib/api";
import {PageHeader} from "@/components/PageHeader";
import ProfileForm from "@/features/practitioners/ProfileForm";
import {useMyProfile, useProfileEditor} from "@/features/practitioners/profile";

export default function MyProfilePage() {
    const profile = useMyProfile();
    const editor = useProfileEditor("/practitioners/me/");

    if (profile.isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="h-12 w-64 animate-pulse rounded-sm bg-slate-200"/>
                <div className="grid gap-3 xl:grid-cols-2">
                    <div className="h-72 animate-pulse rounded-sm bg-slate-200"/>
                    <div className="h-72 animate-pulse rounded-sm bg-slate-200"/>
                </div>
            </div>
        );
    }

    if (profile.error instanceof ApiError && profile.error.status === 404) {
        return (
            <div className="space-y-3">
                <PageHeader icon={User} title="My profile"/>
                <p className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Your login isn't linked to a practitioner profile yet. Ask your practice manager to link it in
                    Settings → Practitioners.
                </p>
            </div>
        );
    }

    if (profile.isError || !profile.data) {
        return (
            <div className="space-y-3">
                <PageHeader icon={User} title="My profile"/>
                <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Couldn't load your profile.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 lg:h-full">
            <div className="shrink-0">
                <PageHeader
                    icon={User}
                    title="My profile"
                    subtitle="How patients get to know you before they book"
                />
            </div>

            {/* The form scrolls on its own on desktop, so the header stays put */}
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                <ProfileForm profile={profile.data} photoPath="/practitioners/me/photo/" {...editor} />
            </div>
        </div>
    );
}