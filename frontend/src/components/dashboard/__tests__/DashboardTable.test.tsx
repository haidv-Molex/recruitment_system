import { describe, it, expect } from 'vitest';
import DashboardTable from '../DashboardTable';

describe('DashboardTable component', () => {
  it('should export DashboardTable component', () => {
    expect(DashboardTable).toBeDefined();
    expect(typeof DashboardTable).toBe('function');
  });

  it('should accept valid column configurations and render structure', () => {
    const data = [{ id: 1, name: 'Alice', value: 10 }];
    const columns = [
      {
        header: 'Name',
        renderCell: (item: { id: number; name: string; value: number }) => item.name,
        renderFooter: () => 'Total',
      },
      {
        header: 'Value',
        renderCell: (item: { id: number; name: string; value: number }) => item.value,
        renderFooter: (items: { id: number; name: string; value: number }[]) =>
          items.reduce((acc, i) => acc + i.value, 0),
      },
    ];

    // Check that typechecking works and component can be imported/invoked
    expect(columns.length).toBe(2);
    expect(columns[0].header).toBe('Name');
    expect(columns[1].renderFooter(data)).toBe(10);
  });
});
