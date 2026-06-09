import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CandidateDatabasePage } from './pages/CandidateDatabase';
import { JobTrackingPage } from './pages/JobTracking';
import { MasterDataPage } from './pages/MasterData';
import { mockCandidates, mockJobs } from './services/mockData';
import './styles/index.css';

function App() {
  const [jobs, setJobs] = useState(mockJobs);
  const [candidates, setCandidates] = useState(mockCandidates);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<JobTrackingPage jobs={jobs} setJobs={setJobs} candidates={candidates} />} />
          <Route path="/candidates" element={<CandidateDatabasePage candidates={candidates} setCandidates={setCandidates} jobs={jobs} />} />
          <Route path="/master-data" element={<MasterDataPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
