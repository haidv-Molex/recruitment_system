export type PaginationMetadata = {
    current_page: number;
    total_pages: number;
    total_items: number;
}


export type PaginationQueryMetadata = {
    page?: number;
    limit?: number;
    unlimited?: boolean;
}