import type { PaginationQueryMetadata } from "@type/pagination";

export type BuiltPagination = {
  unlimited: boolean;
  page: number;
  limit: number;
  offset: number;
};

type BuildPaginationOptions = {
  defaultPage?: number;
  defaultLimit?: number;
};

export function buildPagination(
  params: PaginationQueryMetadata,
  options: BuildPaginationOptions = {}
): BuiltPagination {
  const defaultPage = options.defaultPage ?? 1;
  const defaultLimit = options.defaultLimit ?? 10;
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : defaultPage;
  const limit = params.limit && params.limit > 0 ? params.limit : defaultLimit;
  const offset = (page - 1) * limit;

  return {
    unlimited,
    page,
    limit,
    offset
  };
}

export default buildPagination;