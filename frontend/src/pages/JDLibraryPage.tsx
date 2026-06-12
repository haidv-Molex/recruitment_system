import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import JDUploadForm from '../components/common/JDUploadForm';
import JDCardGrid from '../components/jd-library/JDCardGrid';
import { getAllJDs, getJDFile, addJD, deleteJD, sitesList } from '../services/jdData';
import { masterData } from '../services/mockData';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import Modal from '../components/ui/Modal';

export interface JDLibraryPageProps {
  jobs?: any[];
}

export const JDLibraryPage = ({ jobs = [] }: JDLibraryPageProps) => {
  const [jdItems, setJdItems] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSites, setFilterSites] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadJDs = () => {
    setJdItems(getAllJDs());
  };

  useEffect(() => {
    loadJDs();
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredItems = useMemo(() => {
    let result = jdItems;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          (item.jobTitle || '').toLowerCase().includes(q) ||
          (item.fileName || '').toLowerCase().includes(q) ||
          (item.jobCode && item.jobCode.toLowerCase().includes(q))
      );
    }

    if (filterSites) {
      result = result.filter((item) => item.sites === filterSites);
    }

    if (filterDepartment) {
      result = result.filter((item) => item.department === filterDepartment);
    }

    return result;
  }, [jdItems, searchQuery, filterSites, filterDepartment]);

  const handleUpload = (jdEntry: any) => {
    const result = addJD(jdEntry);
    if (result.success) {
      setMessage({ text: `"${jdEntry.fileName}" uploaded successfully.`, type: 'success' });
      setShowUpload(false);
      loadJDs();
    }
  };

  const handleDelete = (item: any) => {
    if (!confirm(`Delete JD "${item.fileName}"?`)) return;

    const result = deleteJD(item.id);
    if (result.success) {
      setMessage({ text: `"${item.fileName}" deleted.`, type: 'success' });
      loadJDs();
    }
  };

  const handleView = (item: any) => {
    const jd = getJDFile(item.id);
    if (!jd || !jd.fileData) {
      alert('File data not available. The file may have been lost after a page refresh.');
      return;
    }
    const win = window.open();
    if (!win) {
      alert('Popup blocked. Please allow popups to view the file.');
      return;
    }
    win.document.write(`<iframe src="${jd.fileData}" style="width:100%;height:100%;border:none;" />`);
  };

  const handleDownload = (item: any) => {
    const jd = getJDFile(item.id);
    if (!jd || !jd.fileData) {
      alert('File data not available.');
      return;
    }
    const link = document.createElement('a');
    link.href = jd.fileData;
    link.download = jd.fileName;
    link.click();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterSites('');
    setFilterDepartment('');
  };

  const siteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jdItems.forEach((item) => {
      counts[item.sites] = (counts[item.sites] || 0) + 1;
    });
    return counts;
  }, [jdItems]);

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...masterData.department.map((dept) => ({ value: dept, label: dept })),
  ];

  const siteOptions = [
    { value: '', label: 'All Sites' },
    ...sitesList.map((site) => ({ value: site, label: site })),
  ];

  return (
    <div className="max-w-[1000px] mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            📁 JD Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Store and organize Job Descriptions by Site and Department.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} icon={<Plus size={16} />}>
          Upload JD
        </Button>
      </div>

      {/* Site Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          onClick={() => setFilterSites('')}
          className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all ${
            !filterSites ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-150'
          }`}
        >
          <p className="text-2xl font-bold text-slate-800">{jdItems.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">All Sites</p>
        </div>
        {sitesList.map((site) => (
          <div
            key={site}
            onClick={() => setFilterSites(filterSites === site ? '' : site)}
            className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all ${
              filterSites === site ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-150'
            }`}
          >
            <p className="text-2xl font-bold text-slate-800">{siteCounts[site] || 0}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate" title={site}>
              {site}
            </p>
          </div>
        ))}
      </div>

      {/* Message Alerts */}
      {message.text && (
        <div
          className={`text-xs px-3.5 py-2 rounded-lg border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputField
            label="Search Descriptions"
            placeholder="Search by job title, file, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[150px]">
          <SelectField
            label="Site"
            value={filterSites}
            onChange={(e) => setFilterSites(e.target.value)}
            options={siteOptions}
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <SelectField
            label="Department"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            options={departmentOptions}
          />
        </div>
        {(searchQuery || filterSites || filterDepartment) && (
          <Button variant="secondary" onClick={handleClearFilters} className="w-full sm:w-auto h-[38px]">
            Clear
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-1">
        <span>Showing {filteredItems.length} of {jdItems.length} JDs</span>
      </div>

      {/* Cards list */}
      <JDCardGrid
        items={filteredItems}
        onView={handleView}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      {/* Upload Form Modal */}
      {showUpload && (
        <Modal isOpen={true} onClose={() => setShowUpload(false)} title="📁 Upload JD File">
          <JDUploadForm
            jobs={jobs}
            onSubmit={handleUpload}
            onClose={() => setShowUpload(false)}
          />
        </Modal>
      )}
    </div>
  );
};
export default JDLibraryPage;
