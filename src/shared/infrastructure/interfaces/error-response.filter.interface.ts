export interface ErrorResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    requestId?: string;
    stack?: string;
    originalError?: {
        name: string;
        message: string;
    };
    [key: string]: unknown;
}
