import {Link, useNavigate} from "react-router";
import {ArrowLeft} from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";

type Props = {
    title: string;
    description?: string;
};

export default function PlaceholderPage({
                                            title,
                                            description = "We're still building this part of Docq. Check back soon.",
                                        }: Props) {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
                <img
                    src="/doc_icon_v4.png"
                    alt="Docq"
                    className="mx-auto h-16 w-16 object-contain"
                />

                <span className="mt-4 inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Coming soon
                </span>

                <h1 className="mt-3 text-xl font-semibold text-slate-900">{title}</h1>
                <p className="mt-1.5 text-sm text-slate-500">{description}</p>

                <div className="mt-6 flex justify-center gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-1.5 h-4 w-4"/> Go back
                    </Button>
                    <Link to="/" className={buttonVariants()}>
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}