import {Navigate, Outlet, useLocation} from "react-router";
import {useMe} from "@/features/auth/useAuth";
import type {Role} from "@/features/auth/types";

type Props = { roles?: Role[] };

export default function RequireAuth({roles}: Props) {
    const me = useMe();
    const location = useLocation();

    if (me.isLoading) return <p className="p-8 text-slate-500">Loading…</p>;

    if (me.isError) {
        return <p className="p-8 text-red-600">Can't reach the server. Is Django running?</p>;
    }

    if (!me.data) return <Navigate to="/login" replace state={{from: location}}/>;

    // Optional role gate: <RequireAuth roles={["practice_manager"]} />
    if (roles && !roles.includes(me.data.role)) return <Navigate to="/" replace/>;

    return <Outlet/>;
}