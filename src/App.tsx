import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import AppShell from "@/app/AppShell";
import RequireAuth from "@/app/RequireAuth";
import LoginPage from "@/pages/LoginPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import PatientsPage from "@/pages/PatientsPage";
import PatientProfilePage from "@/pages/PatientProfilePage.tsx";
import SignupPage from "@/pages/SignupPage.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/signup" element={<SignupPage/>}/>
                <Route element={<RequireAuth/>}>
                    <Route element={<AppShell/>}>
                        <Route index element={<Navigate to="/diary" replace/>}/>
                        <Route path="diary" element={<PlaceholderPage title="Diary"/>}/>
                        <Route path="patients" element={<PatientsPage/>}/>
                        <Route path="patients/:id" element={<PatientProfilePage/>}/>
                        <Route element={<RequireAuth roles={["receptionist", "practice_manager"]}/>}>
                            <Route path="messages" element={<PlaceholderPage title="Messages"/>}/>
                        </Route>
                        <Route element={<RequireAuth roles={["practice_manager"]}/>}>
                            <Route path="dashboard" element={<PlaceholderPage title="Dashboard"/>}/>
                            <Route path="settings" element={<PlaceholderPage title="Settings"/>}/>
                        </Route>
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}