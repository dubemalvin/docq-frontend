import type {ReactNode} from "react";

type Props = {
    title: string;
    description: string;
    children: ReactNode;
    footer?: ReactNode;
};

export default function AuthLayout({title, description, children, footer}: Props) {
    return (
        <main className="grid min-h-screen lg:grid-cols-2">
            {/* Brand panel (desktop only) */}
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
                <div className="flex items-center gap-3">
                    <img src="/doc_icon.svg" alt="" className="h-12 w-12 object-contain"/>
                    <span className="text-2xl font-semibold tracking-tight">Docq</span>
                </div>

                <div className="max-w-md space-y-3">
                    <h2 className="text-3xl font-semibold leading-tight">
                        Run your practice, not your paperwork.
                    </h2>
                    <p className="text-slate-400">
                        Patients, appointments and reminders in one place, built for South African practices.
                    </p>
                </div>

                <p className="text-xs text-slate-500">© {new Date().getFullYear()} Docq</p>

                <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-600/10"/>
                <div className="pointer-events-none absolute -top-16 right-20 h-40 w-40 rounded-full bg-white/5"/>
            </aside>

            {/* Form side */}
            <section className="flex items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-sm">
                    {/* Logo on mobile, since the brand panel is hidden */}
                    <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                        <img src="/doc_icon.svg" alt="" className="h-10 w-10 object-contain"/>
                        <span className="text-xl font-semibold tracking-tight text-slate-900">Docq</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>

                    <div className="mt-6">{children}</div>

                    {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
                </div>
            </section>
        </main>
    );
}
