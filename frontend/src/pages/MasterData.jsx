import React from 'react';
import { ExcelTable } from '../components/ExcelTable';
import { masterData } from '../services/mockData';

export const MasterDataPage = () => {
  const rows = Object.entries(masterData).flatMap(([type, values]) =>
    values.map((value, index) => ({ id: `${type}-${value}`, type, no: index + 1, value }))
  );

  const columns = [
    { key: 'type', label: 'Master Data Type', width: 220 },
    { key: 'no', label: 'No.', width: 90, align: 'right' },
    { key: 'value', label: 'Dropdown Value', width: 260 },
  ];

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Module 3</p>
          <h1>Data Validation - Master Data</h1>
          <p>Dropdown values used by Job Tracking and Candidate Database to keep the Excel-like tables consistent.</p>
        </div>
      </section>

      <div className="master-grid">
        {Object.entries(masterData).map(([type, values]) => (
          <div key={type} className="master-card">
            <h3>{type}</h3>
            <ol>
              {values.map((value) => <li key={value}>{value}</li>)}
            </ol>
          </div>
        ))}
      </div>

      <ExcelTable title="All Master Data" rows={rows} columns={columns} defaultVisibleColumns={['type', 'no', 'value']} />
    </div>
  );
};
