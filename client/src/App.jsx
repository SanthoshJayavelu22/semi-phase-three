import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loader from './Components/Loader';
import ErrorBoundary from './Components/ErrorBoundary';

// ─── Institute Portal ─────────────────────────────────────────────────────────
// All institute routes share ONE lazy import so React never unmounts the
// component when navigating between steps (e.g. login → apply → dashboard).
// InstitutePortal manages its own internal step routing via useLocation().
//
// Page files live under:  client/src/pages/institute/<page>/index.jsx
// They are logical entry points but all resolve to the same portal instance.
const InstitutePortal = lazy(() => import('./pages/institute/InstitutePortal'));

// ─── Academy Pages ────────────────────────────────────────────────────────────
// Academy uses proper React Router nested routes.
// AcademyLayout is the auth-guarded shell (sidebar + header + Outlet).
// Each sub-page is its own file under client/src/pages/academy/<page>/index.jsx
const AcademyLoginPage        = lazy(() => import('./pages/academy/login/index'));
const AcademyLayout           = lazy(() => import('./pages/academy/AcademyLayout'));
const AcademyDashboardPage    = lazy(() => import('./pages/academy/dashboard/index'));
const AcademyApplicationsPage = lazy(() => import('./pages/academy/applications/index'));
const AcademyStudentsPage     = lazy(() => import('./pages/academy/students/index'));
const AcademyEligibilityPage  = lazy(() => import('./pages/academy/eligibility/index'));
const AcademyVerificationPage = lazy(() => import('./pages/academy/verification/index'));
const AcademyMarksUpdatingPage = lazy(() => import('./pages/academy/marks/index'));
const AcademyStudentMarksPage = lazy(() => import('./pages/academy/student-marks/index'));
const AcademyPublishResultsPage = lazy(() => import('./pages/academy/publish-results/index'));
const AcademyPublishDetailsPage = lazy(() => import('./pages/academy/publish-details/index'));
const AcademyRevaluationPage = lazy(() => import('./pages/academy/revaluation/index'));
const AcademyRemittancePage = lazy(() => import('./pages/academy/remittance/index'));

// ─── Email Verification Page ─────────────────────────────────────────────────
// Standalone page for email verification links
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));

// ─── Public Results Page ──────────────────────────────────────────────────────
const PublicResultsPage = lazy(() => import('./pages/public/results/index'));

const L = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<Loader />}>{children}</Suspense>
  </ErrorBoundary>
);

import { useEffect, useState } from 'react';
import { checkHealth } from './api/health';
import { useTokenRefresh } from './hooks/useTokenRefresh';

function App() {
  const [showMaintenance, setShowMaintenance] = useState(false);

  // Proactively refresh tokens before the 15-minute access-token expiry.
  useTokenRefresh(12 * 60 * 1000);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const health = await checkHealth();
        if (health?.status === 'unhealthy') {
          setShowMaintenance(true);
        }
      } catch (error) {
        console.warn('Initial server health check failed:', error);
      }
    };
    checkServerHealth();
  }, []);

  if (showMaintenance) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h1>System Under Maintenance</h1>
        <p>We are currently experiencing server connectivity issues or routine maintenance. Please try again shortly.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>

      <Routes>

        {/* ═══════════════════════════════════════════════════
            EMAIL VERIFICATION ROUTE
            Direct route for email verification links
            ═══════════════════════════════════════════════════ */}
        <Route path="/verify-email/:token" element={<L><EmailVerificationPage /></L>} />

        {/* ═══════════════════════════════════════════════════
            PUBLIC RESULTS PORTAL
            ═══════════════════════════════════════════════════ */}
        <Route path="/results" element={<L><PublicResultsPage /></L>} />

        {/* ═══════════════════════════════════════════════════
            INSTITUTE PORTAL
            All routes share the SAME InstitutePortal instance
            so internal state (form data, wizard steps) is
            never lost on navigation. InstitutePortal maps
            each path to its internal step via ROUTE_STEPS[].

            Page folder structure:
              pages/institute/login/index.jsx        → /institute/login
              pages/institute/register/index.jsx     → /institute/register
              pages/institute/verify-email/index.jsx → /institute/verify-email
              pages/institute/apply/index.jsx        → /institute/apply
              pages/institute/status/index.jsx       → /institute/status
              pages/institute/dashboard/index.jsx    → /institute/dashboard
              pages/institute/forgot-password/       → /institute/forgot-password
              pages/institute/reset-password/        → /institute/reset-password
            ═══════════════════════════════════════════════════ */}
        <Route path="/institute"                 element={<L><InstitutePortal /></L>} />
        <Route path="/institute/login"           element={<L><InstitutePortal /></L>} />
        <Route path="/institute/register"        element={<L><InstitutePortal /></L>} />
        <Route path="/institute/verify-email"    element={<L><InstitutePortal /></L>} />
        <Route path="/institute/apply"           element={<L><InstitutePortal /></L>} />
        <Route path="/institute/status"          element={<L><InstitutePortal /></L>} />
        <Route path="/institute/dashboard"       element={<L><InstitutePortal /></L>} />
        <Route path="/institute/courses"         element={<L><InstitutePortal /></L>} />
        <Route path="/institute/batches"         element={<L><InstitutePortal /></L>} />
        <Route path="/institute/enrollment"      element={<L><InstitutePortal /></L>} />
        <Route path="/institute/students"        element={<L><InstitutePortal /></L>} />
        <Route path="/institute/fees"            element={<L><InstitutePortal /></L>} />
        <Route path="/institute/exams"           element={<L><InstitutePortal /></L>} />
        <Route path="/institute/studentDetails"  element={<L><InstitutePortal /></L>} />
        <Route path="/institute/hallTicket"      element={<L><InstitutePortal /></L>} />
        <Route path="/institute/results"         element={<L><InstitutePortal /></L>} />
        <Route path="/institute/revaluation"     element={<L><InstitutePortal /></L>} />
        <Route path="/institute/remittance"      element={<L><InstitutePortal /></L>} />
        <Route path="/institute/forgot-password" element={<L><InstitutePortal /></L>} />
        <Route path="/institute/reset-password"  element={<L><InstitutePortal /></L>} />

        {/* ═══════════════════════════════════════════════════
            ACADEMY BOARD PORTAL
            /academy/login  → standalone login page
            /academy/*      → auth-guarded nested routes
                              rendered inside AcademyLayout
                              (sidebar + header + Outlet)

            Page folder structure:
              pages/academy/login/index.jsx          → /academy/login
              pages/academy/dashboard/index.jsx      → /academy/dashboard
              pages/academy/applications/index.jsx   → /academy/applications
              pages/academy/students/index.jsx       → /academy/students
              pages/academy/eligibility/index.jsx    → /academy/eligibility
              pages/academy/verification/index.jsx   → /academy/verification
            ═══════════════════════════════════════════════════ */}
        <Route path="/academy/login" element={<L><AcademyLoginPage /></L>} />
        <Route path="/academy"       element={<Navigate to="/academy/login" replace />} />

        {/* Nested authenticated routes — rendered inside AcademyLayout */}
        <Route path="/academy" element={<L><AcademyLayout /></L>}>
          <Route path="dashboard"    element={<L><AcademyDashboardPage /></L>} />
          <Route path="applications" element={<L><AcademyApplicationsPage /></L>} />
          <Route path="students"     element={<L><AcademyStudentsPage /></L>} />
          <Route path="eligibility"  element={<L><AcademyEligibilityPage /></L>} />
          <Route path="verification" element={<L><AcademyVerificationPage /></L>} />
          <Route path="marks" element={<L><AcademyMarksUpdatingPage /></L>} />
          <Route path="student-marks"    element={<L><AcademyStudentMarksPage /></L>} /> 
          <Route path="publish-results"  element={<L><AcademyPublishResultsPage /></L>} />
          <Route path="publish-details"  element={<L><AcademyPublishDetailsPage /></L>} />
          <Route path="revaluation"      element={<L><AcademyRevaluationPage /></L>} />
          <Route path="remittance"       element={<L><AcademyRemittancePage /></L>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/institute" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;