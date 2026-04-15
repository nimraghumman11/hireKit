import { Module } from '@nestjs/common';
import { InterviewKitController, PublicKitController } from './interview-kit.controller';
import { InterviewKitService } from './interview-kit.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [InterviewKitController, PublicKitController],
  providers: [InterviewKitService],
  exports: [InterviewKitService],
})
export class InterviewKitModule {}
