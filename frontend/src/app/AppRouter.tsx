import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { RequireAdminAuth } from "./RequireAdminAuth";
import { AdminAuditPage } from "../pages/admin/AdminAuditPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminMatchesPage } from "../pages/admin/AdminMatchesPage";
import { AdminParticipantsPage } from "../pages/admin/AdminParticipantsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { AdminTournamentsPage } from "../pages/admin/AdminTournamentsPage";
import { BracketPage } from "../pages/public/BracketPage";
import { ParticipantsPage } from "../pages/public/ParticipantsPage";
import { ResultsPage } from "../pages/public/ResultsPage";
import { SchedulePage } from "../pages/public/SchedulePage";
import { TvPage } from "../pages/public/TvPage";

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/participants" replace />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/bracket" element={<BracketPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/tv" element={<TvPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/tournaments" replace />} />
        <Route path="/admin/tournaments" element={<AdminTournamentsPage />} />
        <Route path="/admin/participants" element={<AdminParticipantsPage />} />
        <Route path="/admin/matches" element={<AdminMatchesPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/participants" replace />} />
    </Routes>
  );
}
