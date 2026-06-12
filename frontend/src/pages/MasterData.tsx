import ExcelTable from '../components/common/ExcelTable';
import MasterCardsList from '../components/master-data/MasterCardsList';
import { masterData } from '../services/mockData';

export const MasterDataPage = () => {
  const rows = Object.entries(masterData).flatMap(([type, values]) =>
    (values as string[]).map((value: string, index: number) => ({ id: `${type}-${value}`, type, no: index + 1, value }))
  );

  const columns = [
    { key: 'type', label: 'Master Data Type', width: 220 },
    { key: 'no', label: 'No.', width: 90, align: 'right' as const },
    { key: 'value', label: 'Dropdown Value', width: 260 },
  ];

  return (
    <div className="space-y-8 p-1">
      {/* Hero Strip */}
      <section className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-2xl p-6 md:p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Module 3</p>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-1 tracking-tight">Data Validation - Master Data</h1>
        <p className="text-sm md:text-base text-emerald-100/90 mt-2 max-w-2xl font-medium">
          Dropdown values used by Job Tracking and Candidate Database to keep the Excel-like tables consistent.
        </p>
      </section>

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
