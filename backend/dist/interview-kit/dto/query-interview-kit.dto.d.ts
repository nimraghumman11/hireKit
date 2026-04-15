export declare enum SortOrder {
    NEWEST = "newest",
    OLDEST = "oldest",
    TITLE = "title"
}
export declare class QueryInterviewKitDto {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    level?: string;
    sort?: SortOrder;
}
