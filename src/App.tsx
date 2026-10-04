import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import AppShell from "@/app/AppShell";
import RequireAuth from "@/app/RequireAuth";
import LoginPage from "@/pages/LoginPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import PatientsPage from "@/pages/PatientsPage";
import PatientProfilePage from "@/pages/PatientProfilePage.tsx";
import SignupPage from "@/pages/SignupPage.tsx";
import DashboardPage from "@/pages/DashboardPage.tsx";
import DiaryPage from "@/pages/DiaryPage.tsx";
import BookingPage from "@/features/booking/BookingPage.tsx";
import ManageAppointmentPage from "@/pages/ManageAppointmentPage.tsx";
import MessagesPage from "@/pages/MessagesPage.tsx";
import PracticeSettingsPage from "@/pages/settings/PracticeSettingsPage.tsx";
import SettingsLayout, {SettingsIndex} from "@/pages/settings/SettingsLayout.tsx";
import PractitionersSettingsPage from "@/pages/settings/PractitionersSettingsPage.tsx";
import AppointmentTypesSettingsPage from "@/pages/settings/AppointmentTypesSettingsPage.tsx";
import StaffSettingsPage from "@/pages/settings/StaffSettingsPage.tsx";
import ResetPasswordPage from "@/pages/ResetPasswordPage.tsx";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage.tsx";
import MyProfilePage from "@/pages/MyProfilePage.tsx";
import PractitionerProfilePage from "@/pages/settings/PractitionerProfilePage.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/signup" element={<SignupPage/>}/>
                <Route path="/book/:slug" element={<BookingPage/>}/>
                <Route path="/a/:token" element={<ManageAppointmentPage/>}/>
                <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route element={<RequireAuth/>}>
                    <Route element={<AppShell/>}>
                        <Route index element={<Navigate to="/diary" replace/>}/>
                        <Route path="diary" element={<DiaryPage/>}/>
                        <Route path="patients" element={<PatientsPage/>}/>
                        <Route path="patients/:id" element={<PatientProfilePage/>}/>
                        <Route element={<RequireAuth roles={["receptionist", "practice_manager"]}/>}>
                            <Route path="messages" element={<MessagesPage/>}/>
                        </Route>
                        <Route element={<RequireAuth roles={["practice_manager"]}/>}>
                            <Route path="dashboard" element={<DashboardPage/>}/>
                            <Route path="settings" element={<SettingsLayout/>}>
                                <Route index element={<SettingsIndex/>}/>
                                <Route path="practice" element={<PracticeSettingsPage/>}/>
                                <Route path="practitioners" element={<PractitionersSettingsPage/>}/>
                                <Route path="practitioners/:id" element={<PractitionerProfilePage/>}/>
                                <Route path="appointment-types" element={<AppointmentTypesSettingsPage/>}/>
                                <Route path="staff" element={<StaffSettingsPage/>}/>
                            </Route>
                        </Route>
                        <Route element={<RequireAuth roles={["doctor", "nurse"]} />}>
                          <Route path="profile" element={<MyProfilePage />} />
                        </Route>
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}