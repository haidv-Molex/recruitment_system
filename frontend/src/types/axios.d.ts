import "axios";

export type ApiResponse<T = any> = {
    result: boolean;
    message: string;
    data?: T;
    type?: string;
    details?: string[];
    pagination?: {
        current_page: number;
        total_pages: number;
        total_items: number;
    };
};

declare module "axios" {
    export interface AxiosResponse<T = any, D = any> {
        data: ApiResponse<T>;
    }

    export interface AxiosError<T = any, D = any> {
        response?: AxiosResponse<T, D>;
    }
}