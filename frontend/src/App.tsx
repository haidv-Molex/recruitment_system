import { useState } from 'react';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/common/Layout';
import { CandidateDatabasePage } from '@/pages/CandidateDatabase';
import { JobTrackingPage } from '@/pages/JobTracking';
import { DashboardPage } from '@/pages/DashboardPage';
import { CompanyPage } from '@/pages/CompanyPage';
import { DepartmentPage } from '@/pages/DepartmentPage';
import { PlatformPage } from '@/pages/PlatformPage';
import { SitePage } from '@/pages/SitePage';
import { LevelPage } from '@/pages/LevelPage';
import { AdminPage } from '@/pages/AdminPage';
import { AccessControlPage } from '@/pages/AccessControl';
import { ProfilePage } from '@/pages/ProfilePage';
import { EmailPage } from '@/pages/EmailPage';
import { LoginPage } from '@/pages/LoginPage';
import { AuditLogDashboard } from '@/pages/AuditLogDashboard';

import { mockCandidates, mockJobs } from '@/services/mockData';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';
import '@/styles/index.css';

function App() {
  const [jobs, setJobs] = useState(mockJobs);
  const [candidates, setCandidates] = useState(mockCandidates);

  return (
    <ConfirmProvider>
      <AuthProvider>
        <HeaderProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/dashboard" element={<Navigate to="/" replace />} />
                      <Route path="/job-tracking" element={<JobTrackingPage jobs={jobs} setJobs={setJobs} />} />
                      <Route path="/candidates" element={<CandidateDatabasePage candidates={candidates} setCandidates={setCandidates} jobs={jobs} />} />
                      <Route path="/companies" element={<CompanyPage />} />
                      <Route path="/departments" element={<DepartmentPage />} />
                      <Route path="/platforms" element={<PlatformPage />} />
                      <Route path="/sites" element={<SitePage />} />
                      <Route path="/levels" element={<LevelPage />} />
                      <Route path="/email" element={<EmailPage />} />
                      <Route path="/profile" element={<ProfilePage />} />

                      {/* Account management: admin and HR can create regular users */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'hr']}>
                            <AdminPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Access control: admin only */}
                      <Route
                        path="/access-control"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AccessControlPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Audit logs: admin only */}
                      <Route
                        path="/admin/audit-logs"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AuditLogDashboard />
                          </ProtectedRoute>
                        }
                      />


                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        </HeaderProvider>
      </AuthProvider>
    </ConfirmProvider>
  );
}

export default App;