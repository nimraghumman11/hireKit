import { AiService } from '../ai/ai.service';
import { InterviewKitService } from '../interview-kit/interview-kit.service';
export declare class ExportService {
    private readonly aiService;
    private readonly kitService;
    constructor(aiService: AiService, kitService: InterviewKitService);
    exportPdf(kitId: string, userId: string): Promise<{
        url: string;
    }>;
}
