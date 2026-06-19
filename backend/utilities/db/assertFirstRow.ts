import { AppError } from "@middlewares/AppError";

export function assertFirstRow<T>(
  rows: T[],
  message: string,
  statusCode = 404
): T {
  if (rows.length === 0) {
    throw new AppError(message, statusCode);
  }

  return rows[0];
}

export default assertFirstRow;