import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, FolderOpen, RefreshCw, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/common/Button';
import ToastContainer from '@/components/common/Toast';
import Pagination from '@/components/ui/Pagination';
import { useHeader } from '@/contexts/HeaderContext';
import { useToast } from '@/hooks/useToast';
import {
  fetchOpenPositionRequestApi,
  fetchOpenPositionRequestsApi,
} from '@/services/openPositionRequestApi';
import type { OpenPositionRequest } from '@/types/openPositionRequest';

const pageSize = 10;

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value || '-'}</div>
    </div>
  );
}

export function OpenPositionRequestsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, removeToast, toast } = useToast();
  const [requests, setRequests] = useState<OpenPositionRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OpenPositionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const selectedId = id ? Number(id) : null;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadRequests = useCallback(async (page: number, searchValue: string) => {
    setLoading(true);
    try {
      const result = await fetchOpenPositionRequestsApi({
        page,
        limit: pageSize,
        search: searchValue,
      });
      setRequests(result.data);
      setTotalItems(result.pagination?.total_items || result.data.length);
      setCurrentPage(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load open position requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (requestId: number) => {
    setDetailLoading(true);
    try {
      const result = await fetchOpenPositionRequestApi(requestId);
      setSelectedRequest(result);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load request detail.');
      setSelectedRequest(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(1, '');
  }, []);

  useEffect(() => {
    if (selectedId && Number.isFinite(selectedId)) {
      loadDetail(selectedId);
    } else {
      setSelectedRequest(null);
    }
  }, [selectedId]);

  const headerActions = useMemo(() => (
    <Button
      type="button"
      variant="secondary"
      icon={<RefreshCw size={16} />}
      onClick={() => loadRequests(currentPage, search)}
    >
      Refresh
    </Button>
  ), [currentPage, search, loadRequests]);

  useHeader({
    title: 'Open Position Requests',
    subTitle: 'Approved Teams/Power Automate requests synced into the recruitment system.',
    actions: headerActions,
  }, [headerActions]);

  const handleSearch = () => {
    loadRequests(1, search);
  };

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Synced Requests</h2>
              <p className="mt-1 text-xs text-slate-500">Power Automate can post approved Teams requests here and receive a detail URL.</p>
            </div>
            <div className="flex min-w-[280px] items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSearch();
                  }}
                  placeholder="Search title, position, requester..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <Button type="button" onClick={handleSearch}>Search</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Position</th>
                  <th className="px-4 py-3 font-bold">Requestor</th>
                  <th className="px-4 py-3 font-bold">Cost Center</th>
                  <th className="px-4 py-3 font-bold">Headcount</th>
                  <th className="px-4 py-3 font-bold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Loading requests...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No open position requests synced yet.</td>
                  </tr>
                ) : (
                  requests.map((request) => {
                    const active = selectedId === request.request_id;
                    return (
                      <tr
                        key={request.request_id}
                        onClick={() => navigate(`/open-position-requests/${request.request_id}`)}
                        className={`cursor-pointer transition-colors ${active ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            {request.approval_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{request.position_title || '-'}</div>
                          <div className="mt-0.5 max-w-[360px] truncate text-xs text-slate-500">{request.title || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{request.requestor_name || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{request.cost_center || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{request.headcount_required ?? '-'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(request.create_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={(page) => loadRequests(page, search)}
              onPageSizeChange={() => undefined}
            />
          </div>
        </section>

        <aside className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          {selectedId ? (
            detailLoading ? (
              <div className="py-20 text-center text-sm text-slate-500">Loading detail...</div>
            ) : selectedRequest ? (
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <FolderOpen size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{selectedRequest.position_title || 'Open Position Request'}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Request #{selectedRequest.request_id}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/open-position-requests')}>
                    Close
                  </Button>
                </div>

                <div className="rounded-lg border border-slate-100 px-4">
                  <DetailRow label="Approval Status" value={selectedRequest.approval_status} />
                  <DetailRow label="Title" value={selectedRequest.title} />
                  <DetailRow label="Requestor" value={selectedRequest.requestor_name} />
                  <DetailRow label="Business Unit" value={selectedRequest.business_unit} />
                  <DetailRow label="Contract Type" value={selectedRequest.contract_type} />
                  <DetailRow label="Direct / Indirect" value={selectedRequest.employment_type} />
                  <DetailRow label="Cost Center" value={selectedRequest.cost_center} />
                  <DetailRow label="Report To" value={selectedRequest.report_to} />
                  <DetailRow label="Headcount Required" value={selectedRequest.headcount_required ?? '-'} />
                  <DetailRow label="Support Project" value={selectedRequest.support_project} />
                  <DetailRow label="Recruitment Reason" value={selectedRequest.recruitment_reason} />
                  <DetailRow label="Synced At" value={formatDate(selectedRequest.create_at)} />
                </div>

                {selectedRequest.teams_link && (
                  <a
                    href={selectedRequest.teams_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Open Teams approval <ExternalLink size={15} />
                  </a>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-sm text-slate-500">Request not found.</div>
            )
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
              <FolderOpen size={34} className="text-slate-300" />
              <div className="mt-3 text-sm font-bold text-slate-700">Select a request</div>
              <div className="mt-1 max-w-xs text-xs text-slate-500">Open a synced Teams approval request to review its IDL tracking fields.</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default OpenPositionRequestsPage;
