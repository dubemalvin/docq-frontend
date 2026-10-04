import type {CSSProperties, ReactNode} from "react";
import {BadgeCheck, CalendarCheck, ClipboardList, Lock, MessageSquareText, Receipt, TrendingDown} from "lucide-react";

type Props = {
    title: string;
    description: string;
    children: ReactNode;
    footer?: ReactNode;
};

// Palette pulled from the Docq logo:
// ink #07090d · navy #022a66 · blue #0553a5 · cyan #05a8e0 · teal #0aa6a6 · green #1bb88a
// Fonts: Fraunces (display) + Plus Jakarta Sans (body). For production, self-host these.
const fontCss = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
.docq-auth { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
.docq-display { font-family: 'Fraunces', Georgia, serif; letter-spacing: -0.015em; }
@keyframes docq-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes docq-in { from { opacity: 0; transform: translateY(16px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes docq-card { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
.docq-pop { animation: docq-in .7s cubic-bezier(.2,.8,.2,1) var(--d, 0s) both, docq-float 6s ease-in-out calc(var(--d, 0s) + .7s) infinite; }
.docq-card { animation: docq-card .6s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .docq-pop, .docq-card { animation: none; } }
`;

/* ---------- Page background: soft logo-colour glows ---------- */
function PageArt() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 1440 900"
                preserveAspectRatio="xMidYMid slice"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="bgBase" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#022a66"/>
                        <stop offset="1" stopColor="#0553a5"/>
                    </linearGradient>
                    <radialGradient id="glowBlue" cx="0.1" cy="0.08" r="0.75">
                        <stop offset="0" stopColor="#05a8e0" stopOpacity="0.55"/>
                        <stop offset="1" stopColor="#05a8e0" stopOpacity="0"/>
                    </radialGradient>
                    <radialGradient id="glowTeal" cx="0.92" cy="0.95" r="0.65">
                        <stop offset="0" stopColor="#1bb88a" stopOpacity="0.55"/>
                        <stop offset="1" stopColor="#1bb88a" stopOpacity="0"/>
                    </radialGradient>
                    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                        <path d="M80 0H0V80" stroke="white" strokeOpacity="0.045" strokeWidth="1"/>
                    </pattern>
                    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.2" fill="white" fillOpacity="0.07"/>
                    </pattern>
                </defs>
                <rect width="1440" height="900" fill="url(#bgBase)"/>
                <rect width="1440" height="900" fill="url(#grid)"/>
                <rect width="1440" height="900" fill="url(#dots)"/>
                <g stroke="#fff" strokeOpacity="0.09" strokeWidth="1.5">
                    <circle cx="720" cy="450" r="330"/>
                    <circle cx="720" cy="450" r="480"/>
                    <circle cx="720" cy="450" r="640"/>
                    <circle cx="720" cy="450" r="820"/>
                </g>
                <g stroke="#fff" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round">
                    {[[120, 140], [1320, 110], [210, 770], [1290, 790], [640, 60], [930, 850], [60, 450], [1385, 470]].map(([x, y]) => (
                        <path key={`${x}-${y}`} d={`M${x} ${y - 9}V${y + 9}M${x - 9} ${y}H${x + 9}`}/>
                    ))}
                </g>
                <rect width="1440" height="900" fill="url(#glowBlue)"/>
                <rect width="1440" height="900" fill="url(#glowTeal)"/>
            </svg>
        </div>
    );
}

/* ---------- Floating product cards ---------- */
function FloatCard({className, delay, children}: { className: string; delay: string; children: ReactNode }) {
    return (
        <div
            style={{"--d": delay} as CSSProperties}
            className={`docq-pop absolute rounded-sm bg-white p-3.5 text-slate-900 shadow-2xl shadow-[#022a66]/40 ring-1 ring-black/5 ${className}`}
        >
            {children}
        </div>
    );
}

// Cut-out photo of the care team. Save it as public/images/care-team.png

/* ---------- Page-level cards that fill the space around the card (wide screens only) ---------- */
const sideCard = "hidden min-[1360px]:block w-[196px] !p-3";

function SideCards() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <FloatCard delay="0.9s" className={`${sideCard} right-[calc(50%_+_468px)] top-[14%]`}>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#0553a5]"><CalendarCheck className="h-3.5 w-3.5"/>Today&apos;s diary</p>
                <ul className="mt-2 space-y-1.5 text-xs">
                    {[["08:30", "J. Pillay", "bg-[#1bb88a]"], ["09:30", "T. Mokoena", "bg-[#05a8e0]"], ["10:15", "S. van Wyk", "bg-[#0aa6a6]"]].map(([t, n, c]) => (
                        <li key={t} className="flex items-center gap-2 rounded-sm bg-slate-50 px-2 py-1.5">
                            <span className={`h-2 w-2 rounded-full ${c}`}/><span className="text-slate-400">{t}</span><span className="font-medium">{n}</span>
                        </li>
                    ))}
                </ul>
            </FloatCard>

            <FloatCard delay="1.1s" className={`${sideCard} right-[calc(50%_+_500px)] top-[60%]`}>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#0553a5]"><MessageSquareText className="h-3.5 w-3.5"/>SMS reminder</p>
                <p className="mt-2 rounded-sm rounded-tl-sm bg-slate-100 p-2 text-xs leading-snug text-slate-700">Hi Thandi, your appointment is tomorrow at 09:30. Reply 1 to confirm.</p>
                <p className="mt-1.5 ml-auto w-fit rounded-sm rounded-tr-sm bg-[#0553a5] px-2.5 py-1 text-xs text-white">1</p>
            </FloatCard>

            <FloatCard delay="1.0s" className={`${sideCard} left-[calc(50%_+_468px)] top-[17%]`}>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#0553a5]"><ClipboardList className="h-3.5 w-3.5"/>Patient record</p>
                <p className="mt-2 text-sm font-semibold">Sipho Dlamini</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">Allergy: Penicillin</span>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">Hypertension</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Consent signed</span>
                </div>
            </FloatCard>

            <FloatCard delay="1.2s" className={`${sideCard} left-[calc(50%_+_500px)] top-[61%]`}>
                <p className="text-xs font-medium text-slate-500">Collected this month</p>
                <p className="mt-0.5 text-xl font-semibold text-[#0553a5]">R 84 200</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#05a8e0] to-[#1bb88a]"/></div>
                <p className="mt-1.5 text-[11px] text-slate-500">R 23 700 outstanding</p>
            </FloatCard>
        </div>
    );
}

const features = [
    {icon: CalendarCheck, label: "Online booking"},
    {icon: MessageSquareText, label: "SMS reminders"},
    {icon: ClipboardList, label: "Patient records"},
    {icon: Receipt, label: "Invoicing"},
];

const PHOTO_SRC = "/care-team.png";

function HeroPanel() {
    return (
        <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-[#022a66] via-[#0553a5] to-[#0aa6a6] px-8 pt-9 text-white lg:flex">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]"/>
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#05a8e0]/40 blur-3xl"/>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#1bb88a]/50 blur-3xl"/>
            <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-32 h-[460px] w-[460px] rounded-full border border-white/10"/>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-52 h-[300px] w-[300px] rounded-full border border-white/10"/>

            <h2 className="docq-display relative max-w-sm text-[2rem] font-medium leading-[1.1]">
                Less admin.<br/>More time with patients.
            </h2>
            <p className="relative mt-2.5 max-w-xs text-sm text-white/80">
                Bookings, reminders, records and invoices in one place.
            </p>

            <div className="relative mt-auto h-[380px] w-full">
                {/* arch the team stands in front of */}
                <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-[250px] w-[240px] -translate-x-1/2 rounded-t-full bg-gradient-to-b from-white/30 to-white/5 ring-1 ring-white/25"/>
                <img
                    src={PHOTO_SRC}
                    alt="A nurse and a doctor smiling"
                    className="absolute bottom-0 left-1/2 h-[300px] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_24px_30px_rgba(2,42,102,0.5)]"
                />

                <FloatCard delay="0.35s" className="left-0 top-0 w-[220px]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0553a5] to-[#05a8e0] text-sm font-semibold text-white">TM</span>
                        <div className="min-w-0 leading-tight">
                            <p className="truncate text-sm font-semibold">Thandi Mokoena</p>
                            <p className="text-xs text-slate-500">Check-up · Tomorrow 09:30</p>
                        </div>
                    </div>
                    <p className="mt-2.5 flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true"/> Confirmed by SMS
                    </p>
                </FloatCard>

                <FloatCard delay="0.55s" className="right-0 top-[46px] w-[122px]">
                    <p className="text-xs font-medium text-slate-500">No-shows</p>
                    <p className="mt-0.5 flex items-center gap-1 text-2xl font-semibold text-[#0553a5]">
                        <TrendingDown className="h-5 w-5 text-[#1bb88a]" aria-hidden="true"/>28%
                    </p>
                    <svg viewBox="0 0 120 32" className="mt-1.5 h-8 w-full" fill="none" aria-hidden="true">
                        <defs>
                            <linearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0" stopColor="#05a8e0"/>
                                <stop offset="1" stopColor="#1bb88a"/>
                            </linearGradient>
                        </defs>
                        <path d="M2 6 C18 8 24 14 40 13 S66 20 80 18 S104 26 118 27" stroke="url(#spark)" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                </FloatCard>

                <FloatCard delay="0.75s" className="bottom-3 left-0 w-[198px]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-[#0aa6a6] to-[#1bb88a] text-white">
                            <Receipt className="h-5 w-5" aria-hidden="true"/>
                        </span>
                        <div className="leading-tight">
                            <p className="text-sm font-semibold">Payment received</p>
                            <p className="text-xs text-slate-500">R 650.00 · Invoice 1042</p>
                        </div>
                    </div>
                </FloatCard>
            </div>
        </aside>
    );
}

export default function AuthLayout({title, description, children, footer}: Props) {
    return (
        <main className="docq-auth relative flex min-h-screen items-center justify-center overflow-hidden bg-[#022a66] p-4 sm:p-8">
            <style>{fontCss}</style>
            <PageArt/>
            <SideCards/>

            <div className="docq-card relative z-10 w-full max-w-4xl">
                <div className="grid overflow-hidden rounded-sm bg-white shadow-2xl shadow-[#011235]/60 ring-1 ring-white/20 lg:grid-cols-[1fr_0.95fr]">
                    {/* Form side */}
                    <section className="flex flex-col justify-between px-8 py-9 sm:px-11 sm:py-10">
                        <div>
                            <div className="mb-8 flex items-center gap-3">
                                <img src="/doc_icon_v4.png" alt="" className="h-11 w-11 object-contain"/>
                                <span className="docq-display text-2xl font-semibold text-[#07090d]">Docq</span>
                            </div>

                            <h1 className="docq-display text-3xl font-semibold leading-tight text-[#07090d]">{title}</h1>
                            <p className="mt-1.5 text-[0.95rem] text-slate-500">{description}</p>

                            <div className="mt-7">{children}</div>
                        </div>

                        <div className="mt-8 space-y-3">
                            {footer && <p className="text-sm text-slate-500">{footer}</p>}
                            <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Lock className="h-3.5 w-3.5" aria-hidden="true"/>
                                Encrypted connection
                            </p>
                        </div>
                    </section>

                    <HeroPanel/>
                </div>

                <ul className="mt-5 hidden flex-wrap items-center justify-center gap-2 sm:flex">
                    {features.map(({icon: Icon, label}) => (
                        <li key={label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 ring-1 ring-white/20 backdrop-blur-sm">
                            <Icon className="h-3.5 w-3.5 text-[#1bb88a]" aria-hidden="true"/>{label}
                        </li>
                    ))}
                </ul>

                <p className="mt-4 text-center text-xs text-white/60">
                    © {new Date().getFullYear()} Docq, an Afridatum product
                </p>
            </div>
        </main>
    );
}