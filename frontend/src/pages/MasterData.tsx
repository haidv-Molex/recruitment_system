import ExcelTable from '../components/common/ExcelTable';
import MasterCardsList from '../components/master-data/MasterCardsList';
import { masterData } from '../services/mockData';
import { useHeader } from '../contexts/HeaderContext';
import { useMemo } from 'react';

export const MasterDataPage = () => {
  const rows = Object.entries(masterData).flatMap(([type, values]) =>
    (values as string[]).map((value: string, index: number) => ({ id: `${type}-${value}`, type, no: index + 1, value }))
  );

  const columns = [
    { key: 'type', label: 'Master Data Type', width: 220 },
    { key: 'no', label: 'No.', width: 90, align: 'right' as const },
    { key: 'value', label: 'Dropdown Value', width: 260 },
  ];

  useHeader({
    title: '📊 Data Validation - Master Data',
    subTitle: 'Dropdown values used by Job Tracking and Candidate Database to keep the Excel-like tables consistent.',
  }, []);

  return (
    <div className="space-y-8 p-1">

      {/* Cards List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Categorized Values</h2>
        <MasterCardsList masterData={masterData as unknown as Record<string, string[]>} />
      </section>

      {/* Excel Table View */}
      <section className="space-y-4">
        <ExcelTable
          title="All Master Data"
          rows={rows}
          columns={columns}
          defaultVisibleColumns={['type', 'no', 'value']}
        />
      </section>
    </div>
  );
};
export default MasterDataPage;
