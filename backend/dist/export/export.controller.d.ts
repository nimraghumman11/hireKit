import { ExportService } from './export.service';
interface AuthRequest extends Request {
    user: {
        id: string;
    };
}
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportPdf(id: string, req: AuthRequest): Promise<{
        url: string;
    }>;
}
export {};
