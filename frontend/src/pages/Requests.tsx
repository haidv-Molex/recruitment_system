import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { mockRequests } from '../services/mockData';
import RequestsTable from '../components/requests/RequestsTable';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import { useHeader } from '../contexts/HeaderContext';
import { useConfirm } from '@/components/ui/ConfirmModal';

export const RequestsPage = () => {
  const confirm = useConfirm();
  const [requests, setRequests] = useState<any[]>(mockRequests);
  const [filterStatus, setFilterStatus] = useState('');

  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  const handleDelete = async (id: string | number) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa 1 yêu cầu không?');
    if (isConfirmed) {
      setRequests(requests.filter((r) => r.id !== id));
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'filled', label: 'Filled' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const headerActions = useMemo(() => (
    <Button icon={<Plus size={16} />}>New Request</Button>
  ), []);

  useHeader({
    title: '📋 Recruitment Requests',
    subTitle: `Total: ${filteredRequests.length} requests`,
    actions: headerActions,
  }, [filteredRequests.length, headerActions]);

  return (
    <div className="space-y-6">

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
