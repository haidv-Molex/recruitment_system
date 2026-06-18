import type { ChartDateRange } from "@type/chart.d";

type DateRangeConditionOptions = {
  fromOperator?: ">=" | ">";
  toOperator?: "<=" | "<";
};

export function buildDateRangeConditions(
  range: ChartDateRange,
  column: string,
  conditions: string[] = [],
  params: any[] = [],
  options: DateRangeConditionOptions = {}
): { conditions: string[]; params: any[] } {
  const fromOperator = options.fromOperator ?? ">=";
  const toOperator = options.toOperator ?? "<=";

  if (range.from !== undefined) {
    params.push(range.from);
    conditions.push(`${column} ${fromOperator} $${params.length}`);
  }

  if (range.to !== undefined) {
    params.push(range.to);
    conditions.push(`${column} ${toOperator} $${params.length}`);
  }

  return { conditions, params };
}

export default buildDateRangeConditions;