import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Download, Trash2, FileText } from 'lucide-react';
import { JDUploadForm } from '../components/JDUploadForm';
import { getAllJDs, getJDFile, addJD, deleteJD, formatFileSize, sitesList } from '../services/jdData';
import { masterData } from '../services/mockData';

export const JDLibraryPage = ({ jobs }) => {
  const [jdItems, setJdItems] = useState([]);
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
    // If a message is displayed, auto-hide it after 3 seconds
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredItems = useMemo(() => {
    let result = jdItems;

    // If search query is not empty, filter by job title or file name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.jobTitle.toLowerCase().includes(q) ||
          item.fileName.toLowerCase().includes(q) ||
          (item.jobCode && item.jobCode.toLowerCase().includes(q))
      );
    }

    // If sites filter is selected, keep only matching items
    if (filterSites) {
      result = result.filter((item) => item.sites === filterSites);
    }

    // If department filter is selected, keep only matching items
    if (filterDepartment) {
      result = result.filter((item) => item.department === filterDepartment);
    }

    return result;
  }, [jdItems, searchQuery, filterSites, filterDepartment]);

  const handleUpload = (jdEntry) => {
    const result = addJD(jdEntry);
    // If upload succeeded, show success message and refresh list
    if (result.success) {
      setMessage({ text: `"${jdEntry.fileName}" uploaded successfully.`, type: 'success' });
      setShowUpload(false);
      loadJDs();
    }
  };

  const handleDelete = (item) => {
    // If user cancels the confirmation, abort deletion
    if (!confirm(`Delete JD "${item.fileName}"?`)) return;

    const result = deleteJD(item.id);
    // If deletion succeeded, show success message and refresh list
    if (result.success) {
      setMessage({ text: `"${item.fileName}" deleted.`, type: 'success' });
      loadJDs();
    }
  };

  const handleView = (item) => {
    const jd = getJDFile(item.id);
    // If JD file data not found, show error
    if (!jd || !jd.fileData) {
      alert('File data not available. The file may have been lost after a page refresh.');
      return;
    }
    const win = window.open();
    // If popup was blocked by browser, show alert
    if (!win) {
      alert('Popup blocked. Please allow popups to view the file.');
      return;
    }
    win.document.write(`<iframe src="${jd.fileData}" style="width:100%;height:100%;border:none;" />`);
  };

  const handleDownload = (item) => {
    const jd = getJDFile(item.id);
    // If JD file data not found, show error
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

  const siteCounts = {};
  // Loop through all JD items to count items per site
  jdItems.forEach((item) => {
    siteCounts[item.sites] = (siteCounts[item.sites] || 0) + 1;
  });

  const s = {
    page: { maxWidth: '1000px', margin: '0 auto', padding: '24px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
    uploadBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    statsRow: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
    statCard: (active) => ({ padding: '12px 20px', background: active ? '#eff6ff' : '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${active ? '#bfdbfe' : '#e2e8f0'}`, cursor: 'pointer', textAlign: 'center', minWidth: '80px' }),
    statNumber: { fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 },
    statLabel: { fontSize: '12px', color: '#64748b', margin: '2px 0 0' },
    filterBar: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' },
    searchWrap: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', flex: 1, minWidth: '200px' },
    searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', background: 'transparent' },
    filterSelect: { padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', outline: 'none' },
    clearBtn: { padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' },
    filterInfo: { fontSize: '13px', color: '#64748b', marginBottom: '12px' },
    message: (type) => ({ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: '16px', background: type === 'success' ? '#f0fdf4' : '#fef2f2', color: type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}` }),
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '12px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9' },
    fileCell: { display: 'flex', alignItems: 'center', gap: '8px' },
    fileName: { fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    fileMeta: { fontSize: '12px', color: '#94a3b8' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' },
    badge: (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: color === 'blue' ? '#eff6ff' : '#f1f5f9', color: color === 'blue' ? '#2563eb' : '#374151', border: `1px solid ${color === 'blue' ? '#bfdbfe' : '#e2e8f0'}` }),
    emptyRow: { textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: '14px' },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>📁 JD Library</h1>
          <p style={s.subtitle}>Store and organize Job Descriptions by Site and Department.</p>
        </div>
        <button type="button" style={s.uploadBtn} onClick={() => setShowUpload(true)}>
          <Plus size={16} /> Upload JD
        </button>
      </div>

      {/* Site stats */}
      <div style={s.statsRow}>
        <div
          style={s.statCard(!filterSites)}
          onClick={() => setFilterSites('')}
        >
          <p style={s.statNumber}>{jdItems.length}</p>
          <p style={s.statLabel}>All</p>
        </div>
        {/* Loop through sites to render stat cards */}
        {sitesList.map((site) => (
          <div
            key={site}
            style={s.statCard(filterSites === site)}
            onClick={() => setFilterSites(filterSites === site ? '' : site)}
          >
            <p style={s.statNumber}>{siteCounts[site] || 0}</p>
            <p style={s.statLabel}>{site}</p>
          </div>
        ))}
      </div>

      {/* Message */}
      {message.text && <div style={s.message(message.type)}>{message.text}</div>}

      {/* Search + Filter */}
      <div style={s.filterBar}>
        <div style={s.searchWrap}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search by job title, file name, or job code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          style={s.filterSelect}
          value={filterSites}
          onChange={(e) => setFilterSites(e.target.value)}
        >
          <option value="">All Sites</option>
          {/* Loop through sites to render filter options */}
          {sitesList.map((site) => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>
        <select
          style={s.filterSelect}
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          {/* Loop through departments to render filter options */}
          {masterData.department.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* If any filter is active, show clear button */}
        {(searchQuery || filterSites || filterDepartment) && (
          <button type="button" style={s.clearBtn} onClick={handleClearFilters}>Clear</button>
        )}
      </div>

      <p style={s.filterInfo}>Showing {filteredItems.length} of {jdItems.length} JDs</p>

      {/* Table */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>File</th>
            <th style={s.th}>Job Title</th>
            <th style={s.th}>Job Code</th>
            <th style={s.th}>Sites</th>
            <th style={s.th}>Department</th>
            <th style={s.th}>Uploaded</th>
            <th style={{ ...s.th, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* If no items match the filter, show empty message */}
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan={7} style={s.emptyRow}>
                {jdItems.length === 0
                  ? 'No JDs uploaded yet. Click "Upload JD" to get started.'
                  : 'No JDs match your search.'}
              </td>
            </tr>
          ) : (
            // Loop through filtered JD items to render each row
            filteredItems.map((item) => (
              <tr key={item.id}>
                <td style={s.td}>
                  <div style={s.fileCell}>
                    <FileText size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <div>
                      <div style={s.fileName}>{item.fileName}</div>
                      <div style={s.fileMeta}>
                        {formatFileSize(item.fileSize)} • {item.fileType.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={s.td}><strong>{item.jobTitle}</strong></td>
                <td style={s.td}>
                  {item.jobCode ? <span style={s.badge('blue')}>{item.jobCode}</span> : '—'}
                </td>
                <td style={s.td}><span style={s.badge('gray')}>{item.sites}</span></td>
                <td style={s.td}><span style={s.badge('gray')}>{item.department}</span></td>
                <td style={s.td}>{item.uploadedDate}</td>
                <td style={{ ...s.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      style={{ ...s.actionBtn, color: '#3b82f6' }}
                      onClick={() => handleView(item)}
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      style={{ ...s.actionBtn, color: '#16a34a' }}
                      onClick={() => handleDownload(item)}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      type="button"
                      style={{ ...s.actionBtn, color: '#ef4444' }}
                      onClick={() => handleDelete(item)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Upload Form Modal */}
      {showUpload && (
        <JDUploadForm
          jobs={jobs}
          onSubmit={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};