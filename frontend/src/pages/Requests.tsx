import { useState } from 'react';
import { Plus } from 'lucide-react';
import { mockRequests } from '../services/mockData';
import RequestsTable from '../components/requests/RequestsTable';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';

export const RequestsPage = () => {
  const [requests, setRequests] = useState<any[]>(mockRequests);
  const [filterStatus, setFilterStatus] = useState('');

  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this request?')) {
      setRequests(requests.filter((r) => r.id !== id));
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'filled', label: 'Filled' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">📋 Recruitment Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Total: {filteredRequests.length} requests</p>
        </div>
        <Button icon={<Plus size={16} />}>New Request</Button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 max-w-sm">
        <SelectField
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={statusOptions}
        />
      </div>

      {/* Requests Table */}
      <RequestsTable requests={filteredRequests} onDelete={handleDelete} />
    </div>
  );
};
export default RequestsPage;
