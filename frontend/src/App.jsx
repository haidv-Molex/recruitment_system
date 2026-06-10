import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { CandidateDatabasePage } from './pages/CandidateDatabase';
import { JobTrackingPage } from './pages/JobTracking';
import { MasterDataPage } from './pages/MasterData';
import { JDLibraryPage } from './pages/JDLibraryPage';
import { CompanyPage } from './pages/CompanyPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { mockCandidates, mockJobs } from './services/mockData';
import './styles/index.css';

function App() {
  const [jobs, setJobs] = useState(mockJobs);
  const [candidates, setCandidates] = useState(mockCandidates);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<JobTrackingPage jobs={jobs} setJobs={setJobs} candidates={candidates} />} />
                    <Route path="/candidates" element={<CandidateDatabasePage candidates={candidates} setCandidates={setCandidates} jobs={jobs} />} />
                    <Route path="/master-data" element={<MasterDataPage />} />
                    <Route path="/jd-library" element={<JDLibraryPage jobs={jobs} />} />
                    <Route path="/companies" element={<CompanyPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Admin route: requires admin role to access */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminPage />
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
    </AuthProvider>
  );
}

export default App;