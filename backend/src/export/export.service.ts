import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { InterviewKitService } from '../interview-kit/interview-kit.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly aiService: AiService,
    private readonly kitService: InterviewKitService,
  ) {}

  async exportPdf(kitId: string, userId: string): Promise<{ url: string }> {
    const kit = await this.kitService.findById(kitId, userId);
    const url = await this.aiService.exportPdf(kitId, kit);
    return { url };
  }
}
