import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { AiModule } from '../ai/ai.module';
import { InterviewKitModule } from '../interview-kit/interview-kit.module';

@Module({
  imports: [AiModule, InterviewKitModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
