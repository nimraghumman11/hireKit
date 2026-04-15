import {
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { z } from 'zod';
import type { IncomingMessage } from 'http';
import type { CreateInterviewKitDto } from '../interview-kit/dto/create-interview-kit.dto';

const jobDescriptionSchema = z.object({
  summary: z.string().default(''),
  // Rich structured sections (from improved prompts)
  aboutTheRole: z.string().nullish(),
  whyJoinUs: z.string().nullish(),
  requiredQualifications: z.array(z.string()).default([]),
  preferredQualifications: z.array(z.string()).default([]),
  whatYoullBring: z.string().nullish(),
  compensationAndBenefits: z.string().nullish(),
  // Core fields
  responsibilities: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
  workMode: z.string().default('remote'),
  salaryRange: z.string().nullish(),
});

const kitSchema = z.object({
  roleTitle: z.string(),
  department: z.string(),
  experienceLevel: z.string(),
  jobDescription: jobDescriptionSchema,
  behavioralQuestions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      competency: z.string(),
      evalCriteria: z.string(),
      followUps: z.array(z.string()),
      scoringGuide: z.object({ '1': z.string(), '3': z.string(), '5': z.string() }),
    }),
  ),
  technicalQuestions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      topic: z.string(),
      evalCriteria: z.string(),
      sampleAnswer: z.string(),
      redFlags: z.array(z.string()),
    }),
  ),
  scorecard: z.array(
    z.object({
      competency: z.string(),
      weight: z.number(),
      score: z.number().nullish(),
      notes: z.string().nullish(),
    }),
  ),
  rubric: z.array(
    z.object({
      skill: z.string(),
      proficiencyLevels: z.object({
        novice: z.string(),
        intermediate: z.string(),
        advanced: z.string(),
        expert: z.string(),
      }),
    }),
  ),
  languageIssues: z.array(
    z.object({
      term: z.string(),
      suggestion: z.string(),
      severity: z.enum(['warning', 'error']),
      source: z.enum(['jobDescription', 'behavioralQuestions', 'technicalQuestions', 'rubric']),
    }),
  ).default([]),
});

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly TIMEOUT_MS = 300_000;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async generateKit(dto: CreateInterviewKitDto) {
    this.logger.log('Generating kit from plain description');

    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/generate-kit`, { description: dto.description }).pipe(
        timeout(this.TIMEOUT_MS),
        catchError((err) => {
          const isTimeout = err.name === 'TimeoutError' || err.code === 'ECONNABORTED';
          if (isTimeout) {
            throw new ServiceUnavailableException({
              error: 'AI_TIMEOUT',
              message: 'AI service did not respond in time',
            });
          }
          if (err.response?.status >= 500) {
            throw new ServiceUnavailableException({
              error: 'AI_UNAVAILABLE',
              message: 'AI service is temporarily unavailable',
            });
          }
          throw err;
        }),
      ),
    );

    const parsed = kitSchema.safeParse(response.data);
    if (!parsed.success) {
      this.logger.error('AI returned invalid schema', parsed.error.format());
      throw new UnprocessableEntityException({
        error: 'AI_INVALID_SCHEMA',
        message: 'AI returned a response that does not match the expected schema',
      });
    }

    return parsed.data;
  }

  /**
   * Open a streaming HTTP request to the AI service's SSE endpoint.
   * Returns the raw Node.js IncomingMessage (Readable) so callers can pipe
   * SSE events directly to the client without buffering the full response.
   */
  async streamGenerateKit(dto: CreateInterviewKitDto): Promise<IncomingMessage> {
    try {
      const response = await this.httpService.axiosRef.post<IncomingMessage>(
        `${this.baseUrl}/generate-kit/stream`,
        { description: dto.description },
        { responseType: 'stream', timeout: this.TIMEOUT_MS },
      );
      return response.data;
    } catch (err: unknown) {
      this.logger.error('Failed to open AI stream', err);
      throw new ServiceUnavailableException({
        error: 'AI_UNAVAILABLE',
        message: 'AI service is temporarily unavailable',
      });
    }
  }

  async regenerateSection(section: string, roleInput: Record<string, unknown>, kitId: string) {
    this.logger.log(`Regenerating section=${section} for kitId=${kitId}`);

    const response = await firstValueFrom(
      this.httpService
        .post(`${this.baseUrl}/regenerate/${section}`, { kitId, roleInput })
        .pipe(
          timeout(120_000),
          catchError((err) => {
            throw new ServiceUnavailableException({
              error: 'REGEN_FAILED',
              message: `Failed to regenerate ${section}`,
            });
          }),
        ),
    );

    return response.data;
  }

  async exportPdf(kitId: string, kitData: unknown): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/export/pdf`, { kitId, kitData }).pipe(
        timeout(60_000),
        catchError(() => {
          throw new ServiceUnavailableException({
            error: 'EXPORT_FAILED',
            message: 'PDF generation failed',
          });
        }),
      ),
    );

    return (response.data as { url: string }).url;
  }

  async exportDocx(kitId: string, kitData: unknown): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/export/docx`, { kitId, kitData }).pipe(
        timeout(60_000),
        catchError(() => {
          throw new ServiceUnavailableException({
            error: 'EXPORT_FAILED',
            message: 'DOCX generation failed',
          });
        }),
      ),
    );

    return (response.data as { url: string }).url;
  }
}
