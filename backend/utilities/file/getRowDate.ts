type RowLike = Record<string, any>;

type GetRowDateOptions = {
  validate?: boolean;
};

export function getRowDate(
  row: RowLike,
  header: string,
  options: GetRowDateOptions = {}
): Date | null {
  const value = row[header];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (options.validate === true && Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export default getRowDate;