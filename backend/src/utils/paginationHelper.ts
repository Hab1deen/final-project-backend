export interface PaginationParams {
    page?: any;
    limit?: any;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}

/**
 * คำนวณ skip และ take สำหรับ Prisma pagination
 */
export const getPaginationParams = (params: PaginationParams) => {
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 100;

    const page = Math.max(1, parseInt(String(params.page || 1)));
    const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, parseInt(String(params.limit || DEFAULT_LIMIT)))
    );

    const skip = (page - 1) * limit;
    const take = limit;

    return { skip, take, page, limit };
};

/**
 * สร้าง pagination metadata
 */
export const createPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};

/**
 * สร้าง paginated response
 */
export const createPaginatedResponse = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResponse<T> => {
    return {
        data,
        pagination: createPaginationMeta(total, page, limit)
    };
};
