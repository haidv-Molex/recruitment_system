import type { ChartDataPoint } from "@type/chart.d";

type MapChartRowsOptions = {
  labelField?: string;
  valueField?: string;
  defaultLabel?: string;
};

export function mapChartRows(
  rows: Record<string, any>[],
  options: MapChartRowsOptions = {}
): ChartDataPoint[] {
  const labelField = options.labelField ?? "label";
  const valueField = options.valueField ?? "value";

  return rows.map((row) => {
    const rawLabel = row[labelField];
    const label = rawLabel === null || rawLabel === undefined || rawLabel === ""
      ? options.defaultLabel ?? ""
      : String(rawLabel);

    return {
      label,
      value: Number(row[valueField] ?? 0)
    } satisfies ChartDataPoint;
  });
}

export default mapChartRows;