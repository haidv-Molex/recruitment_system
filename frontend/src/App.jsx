import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';          // ★ NEW
import { ProtectedRoute } from './components/ProtectedRoute';  // ★ NEW
import { Layout } from './components/Layout';
import { CandidateDatabasePage } from './pages/CandidateDatabase';
import { JobTrackingPage } from './pages/JobTracking';
import { MasterDataPage } from './pages/MasterData';
import { LoginPage } from './pages/LoginPage';                 // ★ NEW
import { mockCandidates, mockJobs } from './services/mockData';
import './styles/index.css';

function App() {
  const [jobs, setJobs] = useState(mockJobs);
  const [candidates, setCandidates] = useState(mockCandidates);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ★ NEW — Trang Login (không cần Layout) */}
          <Route path="/login" element={<LoginPage />} />

          {/* ★ NEW — Tất cả trang khác: phải login mới vào được */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<JobTrackingPage jobs={jobs} setJobs={setJobs} candidates={candidates} />} />
                    <Route path="/candidates" element={<CandidateDatabasePage candidates={candidates} setCandidates={setCandidates} jobs={jobs} />} />
                    <Route path="/master-data" element={<MasterDataPage />} />
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