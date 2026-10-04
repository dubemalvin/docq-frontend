import {useState, type ReactNode} from "react";
import {Banknote, Info, ShieldPlus, type LucideIcon} from "lucide-react";
import Field from "@/components/Field";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {selectClass} from "@/features/practitioners/ProfileBlocks";
import {cn} from "@/lib/utils";

export type PaymentChoice = {
    method: "cash" | "medical_aid";
    scheme: string;
    schemeOther: string;
    memberNumber: string;
    dependantCode: string;
    mainMember: string;
};

export const CASH: PaymentChoice = {
    method: "cash", scheme: "", schemeOther: "", memberNumber: "", dependantCode: "", mainMember: "",
};

const OTHER = "__other";
const SCHEMES = [
    "Discovery Health", "Bonitas", "Momentum Health", "Medshield", "GEMS", "Fedhealth",
    "Bestmed", "Medihelp", "Profmed", "Sizwe Hosmed", "KeyHealth", "Medihelp",
].filter((name, i, all) => all.indexOf(name) === i).sort((a, b) => a.localeCompare(b));

const schemeName = (p: PaymentChoice) => (p.scheme === OTHER ? p.schemeOther.trim() : p.scheme);

/** What the booking request should carry. null means the patient is paying privately. */
export function paymentPayload(p: PaymentChoice) {
    if (p.method === "cash") return null;
    return {
        medical_aid_name: schemeName(p),
        medical_aid_number: p.memberNumber.trim(),
        medical_aid_dependant_code: p.dependantCode.trim(),
        medical_aid_main_member: p.mainMember.trim(),
    };
}

export const paymentLabel = (p: PaymentChoice) =>
    p.method === "cash" ? "Private patient (cash or card on the day)" : `${schemeName(p)}, member ${p.memberNumber.trim()}`;

function validate(p: PaymentChoice): Record<string, string> {
    const errors: Record<string, string> = {};
    if (p.method === "cash") return errors;
    if (!schemeName(p)) errors.scheme = p.scheme === OTHER ? "Enter the name of your medical aid" : "Choose your medical aid";
    if (!/^[A-Za-z0-9\- ]{3,20}$/.test(p.memberNumber.trim())) errors.memberNumber = "Enter your membership number";
    if (!/^\d{0,2}$/.test(p.dependantCode.trim())) errors.dependantCode = "Use up to 2 digits, e.g. 00";
    return errors;
}

function Option({icon: Icon, title, description, selected, onClick}: {
    icon: LucideIcon;
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onClick}
            className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                selected ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 bg-white hover:border-slate-400",
            )}
        >
            <span className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                selected ? "bg-slate-900 text-white" : "bg-slate-100 text-blue-600",
            )}>
                <Icon className="h-5 w-5"/>
            </span>
            <span>
                <span className="block font-medium text-slate-900">{title}</span>
                <span className="block text-sm text-slate-500">{description}</span>
            </span>
        </button>
    );
}

type Props = {
    value: PaymentChoice;
    onChange: (value: PaymentChoice) => void;
    onContinue: () => void;
    onBack: () => void;
    footer?: ReactNode;
};

export default function PaymentStep({value, onChange, onContinue, onBack}: Props) {
    const [showErrors, setShowErrors] = useState(false);
    const errors = showErrors ? validate(value) : {};
    const set = (patch: Partial<PaymentChoice>) => onChange({...value, ...patch});

    function next() {
        setShowErrors(true);
        if (Object.keys(validate(value)).length) return;
        onContinue();
    }

    return (
        <section className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">How will you pay?</h2>
                <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:underline"
                    onClick={() => {
                        onChange(CASH);
                        onContinue();
                    }}
                >
                    Skip, I'll pay privately
                </button>
            </header>

            <div className="flex-1 space-y-5 p-4">
                <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
                    <Option
                        icon={ShieldPlus}
                        title="Medical aid"
                        description="Add your scheme and membership number"
                        selected={value.method === "medical_aid"}
                        onClick={() => set({method: "medical_aid"})}
                    />
                    <Option
                        icon={Banknote}
                        title="Private patient"
                        description="Pay by cash or card on the day"
                        selected={value.method === "cash"}
                        onClick={() => set({method: "cash"})}
                    />
                </div>

                {value.method === "medical_aid" && (
                    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Medical aid" htmlFor="scheme" error={errors.scheme}>
                                <select
                                    id="scheme"
                                    className={selectClass}
                                    value={value.scheme}
                                    onChange={(e) => set({scheme: e.target.value})}
                                >
                                    <option value="">Choose your scheme…</option>
                                    {SCHEMES.map((name) => <option key={name} value={name}>{name}</option>)}
                                    <option value={OTHER}>Other</option>
                                </select>
                            </Field>
                            {value.scheme === OTHER && (
                                <Field label="Name of your medical aid" htmlFor="scheme_other" error={errors.scheme}>
                                    <Input id="scheme_other" value={value.schemeOther}
                                           onChange={(e) => set({schemeOther: e.target.value})}/>
                                </Field>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Membership number" htmlFor="member_number" error={errors.memberNumber}>
                                <Input id="member_number" autoComplete="off" value={value.memberNumber}
                                       onChange={(e) => set({memberNumber: e.target.value})}/>
                            </Field>
                            <Field label="Dependant code" htmlFor="dependant_code" error={errors.dependantCode}
                                   hint="Optional. 00 is the main member">
                                <Input id="dependant_code" inputMode="numeric" maxLength={2} value={value.dependantCode}
                                       onChange={(e) => set({dependantCode: e.target.value})}/>
                            </Field>
                        </div>

                        <Field label="Main member's name" htmlFor="main_member"
                               hint="Optional. Only if the patient is a dependant">
                            <Input id="main_member" autoComplete="off" value={value.mainMember}
                                   onChange={(e) => set({mainMember: e.target.value})}/>
                        </Field>

                        <p className="flex items-start gap-2 text-xs text-slate-500">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"/>
                            These details help the practice prepare. Your cover isn't guaranteed, and you may still
                            owe a co-payment at your visit.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex gap-2 border-t border-slate-100 p-4">
                <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
                <Button type="button" className="flex-1" onClick={next}>Continue</Button>
            </div>
        </section>
    );
}