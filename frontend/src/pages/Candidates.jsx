import React, { useState, useEffect } from 'react';
import { CandidateTable } from '../components/CandidateTable';
import { CandidateForm } from '../components/CandidateForm';
import { mockCandidates } from '../services/mockData';
import { Plus, Filter } from 'lucide-react';

export const CandidatesPage = () => {
  const [candidates, setCandidates] = useState(mockCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState(mockCandidates);
  const [showForm, setShowForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter candidates
  useEffect(() => {
    let filtered = candidates;

    if (filterStatus) {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    if (filterDepartment) {
      filtered = filtered.filter((c) => c.department === filterDepartment);
    }

    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCandidates(filtered);
  }, [candidates, filterStatus, filterDepartment, searchQuery]);

  const handleAddCandidate = async (data) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newCandidate = {
        ...data,
        id: `cand-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCandidates([...candidates, newCandidate]);
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidate = async (data) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (selectedCandidate) {
        setCandidates(
          candidates.map((c) =>
            c.id === selectedCandidate.id
              ? { ...c, ...data, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }
      setShowForm(false);
      setSelectedCandidate(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = (id) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      setCandidates(candidates.filter((c) => c.id !== id));
    }
  };

  const handleOpenForm = (candidate) => {
    setSelectedCandidate(candidate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedCandidate(undefined);
  };

  const uniqueStatuses = Array.from(new Set(candidates.map((c) => c.status)));
  const uniqueDepartments = Array.from(new Set(candidates.map((c) => c.department)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Candidates</h1>
          <p className="text-gray-600 mt-1">Total: {filteredCandidates.length} candidates</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Candidate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <CandidateTable
          candidates={filteredCandidates}
          onEdit={handleOpenForm}
          onDelete={handleDeleteCandidate}
          onSelectRow={handleOpenForm}
          loading={false}
        />
      </div>

      {/* Candidate Form Modal */}
      {showForm && (
        <CandidateForm
          candidate={selectedCandidate}
          onSubmit={selectedCandidate ? handleUpdateCandidate : handleAddCandidate}
          onClose={handleCloseForm}
          loading={loading}
        />
      )}
    </div>
  );
};

