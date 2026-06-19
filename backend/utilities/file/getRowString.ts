type RowLike = Record<string, any>;

type GetRowStringOptions<TDefault extends string | null = null> = {
  defaultValue?: TDefault;
  emptyValue?: string | null;
};

export function getRowString(row: RowLike, header: string, options: { defaultValue: string; emptyValue?: string | null }): string;
export function getRowString(row: RowLike, header: string, options?: GetRowStringOptions<null>): string | null;
export function getRowString(
  row: RowLike,
  header: string,
  options: GetRowStringOptions<string | null> = {}
): string | null {
  const defaultValue = options.defaultValue ?? null;
  const emptyValue = options.emptyValue !== undefined ? options.emptyValue : defaultValue;
  const value = row[header];

  if (value === undefined || value === null) {
    return defaultValue;
  }

  const trimmed = String(value).trim();
  return trimmed || emptyValue;
}

export default getRowString;