import { useState, useEffect } from 'react';
import { candidateService } from '../services/candidateService';

export const useCandidates = (filters) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const data = await candidateService.getAll(filters);
        setCandidates(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch candidates');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [filters?.status, filters?.department]);

  const addCandidate = async (candidate) => {
    try {
      const newCandidate = await candidateService.create(candidate);
      setCandidates([...candidates, newCandidate]);
      return newCandidate;
    } catch (err) {
      throw err;
    }
  };

  const updateCandidate = async (id, updates) => {
    try {
      const updated = await candidateService.update(id, updates);
      setCandidates(candidates.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteCandidate = async (id) => {
    try {
      await candidateService.delete(id);
      setCandidates(candidates.filter((c) => c.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    candidates,
    loading,
    error,
    addCandidate,
    updateCandidate,
    deleteCandidate,
  };
};