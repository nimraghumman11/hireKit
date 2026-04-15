import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateInterviewKitDto } from './dto/create-interview-kit.dto';
import { UpdateScorecardDto } from './dto/update-interview-kit.dto';
import { QueryInterviewKitDto, SortOrder } from './dto/query-interview-kit.dto';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

const VALID_SECTIONS = [
  'job-description',
  'behavioral-questions',
  'technical-questions',
  'scorecard',
  'rubric',
] as const;
type SectionKey = typeof VALID_SECTIONS[number];

const SECTION_OUTPUT_KEY: Record<SectionKey, string> = {
  'job-description': 'jobDescription',
  'behavioral-questions': 'behavioralQuestions',
  'technical-questions': 'technicalQuestions',
  'scorecard': 'scorecard',
  'rubric': 'rubric',
};

@Injectable()
export class InterviewKitService {
  private readonly logger = new Logger(InterviewKitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Create a pending DB record, then stream SSE progress events from the AI
   * service to the HTTP response.  On completion the kit is saved and a
   * `complete` event with `{ kitId }` is sent.  On error a `failed` status is
   * written to the DB and an `error` event is sent.
   */
  async generateStream(dto: CreateInterviewKitDto, userId: string, res: Response): Promise<void> {
    const kit = await this.prisma.interviewKit.create({
      data: {
        userId,
        roleTitle: 'Generating…',
        department: 'Pending',
        experienceLevel: 'mid',
        workMode: 'remote',
        status: 'generating',
      },
    });

    const writeEvent = (event: string, data: unknown) => {
      if (!res.writableEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    // Send the kit ID immediately so the frontend can navigate / track it
    writeEvent('created', { kitId: kit.id });

    const start = Date.now();

    try {
      const aiStream = await this.aiService.streamGenerateKit(dto);

      await new Promise<void>((resolve, reject) => {
        let buffer = '';
        let finalKit: unknown = null;
        let lastEventType = '';

        aiStream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          // SSE events are separated by double newline
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            if (!block.trim()) continue;
            let eventType = 'message';
            let eventData = '';
            for (const line of block.split('\n')) {
              if (line.startsWith('event: ')) eventType = line.slice(7).trim();
              if (line.startsWith('data: '))  eventData = line.slice(6).trim();
            }
            lastEventType = eventType;

            if (eventType === 'progress') {
              writeEvent('progress', JSON.parse(eventData));
            } else if (eventType === 'section_start') {
              writeEvent('section_start', JSON.parse(eventData));
            } else if (eventType === 'token') {
              writeEvent('token', JSON.parse(eventData));
            } else if (eventType === 'section_done') {
              writeEvent('section_done', JSON.parse(eventData));
            } else if (eventType === 'complete') {
              const parsed = JSON.parse(eventData) as { kit: unknown };
              finalKit = parsed.kit;
              // Defer forwarding until DB save succeeds (below)
            } else if (eventType === 'error') {
              writeEvent('error', JSON.parse(eventData));
            }
          }
        });

        aiStream.on('end', () => {
          if (!finalKit) {
            writeEvent('error', { message: 'AI service did not return a kit' });
            res.end();
            return resolve();
          }

          this.saveGeneratedKit(kit.id, userId, dto, finalKit, start)
            .then(() => {
              writeEvent('complete', { kitId: kit.id });
              res.end();
              resolve();
            })
            .catch((saveErr: unknown) => {
              this.logger.error(`Failed to save kit kitId=${kit.id}`, saveErr);
              writeEvent('error', { message: 'Failed to save generated kit' });
              res.end();
              reject(saveErr);
            });
        });

        aiStream.on('error', reject);
      });
    } catch (err: unknown) {
      this.logger.error(`generateStream failed kitId=${kit.id}`, err);
      await this.prisma.interviewKit.update({ where: { id: kit.id }, data: { status: 'failed' } });
      writeEvent('error', { message: 'Kit generation failed. Please try again.' });
      if (!res.writableEnded) res.end();
    }
  }

  private async saveGeneratedKit(
    kitId: string,
    userId: string,
    dto: CreateInterviewKitDto,
    generatedOutput: unknown,
    startMs: number,
  ) {
    const output = generatedOutput as Record<string, unknown>;
    await this.prisma.interviewKit.update({
      where: { id: kitId },
      data: {
        generatedOutput: generatedOutput as Prisma.InputJsonValue,
        status: 'generated',
        roleTitle: (output['roleTitle'] as string) || 'Untitled Role',
        department: (output['department'] as string) || 'General',
        experienceLevel: (output['experienceLevel'] as string) || 'mid',
      },
    });
    await this.prisma.aILog.create({
      data: {
        kitId,
        userId,
        requestPayload: dto as unknown as Prisma.InputJsonValue,
        responsePayload: generatedOutput as Prisma.InputJsonValue,
        status: 'success',
        durationMs: Date.now() - startMs,
      },
    });
  }

  async generate(dto: CreateInterviewKitDto, userId: string) {
    const kit = await this.prisma.interviewKit.create({
      data: {
        userId,
        roleTitle: 'Generating…',
        department: 'Pending',
        experienceLevel: 'mid',
        workMode: 'remote',
        status: 'generating',
      },
    });

    this.runGeneration(kit.id, userId, dto).catch(async (err: unknown) => {
      this.logger.error(`Kit generation failed kitId=${kit.id}`, err);
      await this.prisma.interviewKit.update({
        where: { id: kit.id },
        data: { status: 'failed' },
      });
    });

    return this.mapKit(kit);
  }

  private async runGeneration(kitId: string, userId: string, dto: CreateInterviewKitDto) {
    const start = Date.now();
    let responsePayload: unknown = null;

    try {
      const generatedOutput = await this.aiService.generateKit(dto);
      responsePayload = generatedOutput;

      const output = generatedOutput as Record<string, unknown>;
      await this.prisma.interviewKit.update({
        where: { id: kitId },
        data: {
          generatedOutput: generatedOutput as Prisma.InputJsonValue,
          status: 'generated',
          roleTitle: (output['roleTitle'] as string) || 'Untitled Role',
          department: (output['department'] as string) || 'General',
          experienceLevel: (output['experienceLevel'] as string) || 'mid',
        },
      });

      await this.prisma.aILog.create({
        data: {
          kitId,
          userId,
          requestPayload: dto as unknown as Prisma.InputJsonValue,
          responsePayload: responsePayload as Prisma.InputJsonValue,
          status: 'success',
          durationMs: Date.now() - start,
        },
      });
    } catch (err) {
      await this.prisma.aILog.create({
        data: {
          kitId,
          userId,
          requestPayload: dto as unknown as Prisma.InputJsonValue,
          responsePayload: Prisma.DbNull,
          status: 'failed',
          durationMs: Date.now() - start,
        },
      });
      throw err;
    }
  }

  async findAll(userId: string, query: QueryInterviewKitDto) {
    const { page = 1, limit = 12, search, department, level, sort } = query;

    const where: Prisma.InterviewKitWhereInput = {
      userId,
      deletedAt: null,
      ...(search && { roleTitle: { contains: search, mode: 'insensitive' } }),
      ...(department && { department }),
      ...(level && { experienceLevel: level }),
    };

    const orderBy: Prisma.InterviewKitOrderByWithRelationInput =
      sort === SortOrder.OLDEST
        ? { createdAt: 'asc' }
        : sort === SortOrder.TITLE
        ? { roleTitle: 'asc' }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.interviewKit.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.interviewKit.count({ where }),
    ]);

    return {
      items: items.map((k) => this.mapKit(k)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, userId: string) {
    const kit = await this.getKitEntity(id, userId);
    return this.mapKit(kit);
  }

  private async getKitEntity(id: string, userId: string) {
    const kit = await this.prisma.interviewKit.findFirst({ where: { id, deletedAt: null } });
    if (!kit) throw new NotFoundException({ error: 'KIT_NOT_FOUND', message: 'Interview kit not found' });
    if (kit.userId !== userId) throw new ForbiddenException({ error: 'KIT_FORBIDDEN', message: 'Access denied' });
    return kit;
  }

  async getStatus(id: string, userId: string) {
    const kit = await this.findById(id, userId);
    return { status: kit.status };
  }

  /** Inline-edit: persist updated sections back to generatedOutput. */
  async updateKit(id: string, userId: string, updates: Record<string, unknown>) {
    const existing = await this.getKitEntity(id, userId);
    const currentOutput = (existing.generatedOutput as Record<string, unknown>) ?? {};

    // Only allow updating content sections, not metadata
    const allowedKeys = ['jobDescription', 'behavioralQuestions', 'technicalQuestions', 'scorecard', 'rubric'];
    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowedKeys.includes(k)),
    );

    const updatedOutput = { ...currentOutput, ...sanitized };

    const updated = await this.prisma.interviewKit.update({
      where: { id },
      data: { generatedOutput: updatedOutput as unknown as Prisma.InputJsonValue },
    });

    return this.mapKit(updated);
  }

  async updateScorecard(id: string, userId: string, dto: UpdateScorecardDto) {
    const existing = await this.getKitEntity(id, userId);
    const updatedOutput = {
      ...((existing.generatedOutput as Record<string, unknown>) ?? {}),
      scorecard: dto.scorecard,
    };

    const updated = await this.prisma.interviewKit.update({
      where: { id },
      data: { generatedOutput: updatedOutput as unknown as Prisma.InputJsonValue },
    });

    return this.mapKit(updated);
  }

  /** Regenerate a single section by calling the AI service. */
  async regenerateSection(id: string, userId: string, section: string) {
    if (!VALID_SECTIONS.includes(section as SectionKey)) {
      throw new BadRequestException({
        error: 'INVALID_SECTION',
        message: `Section must be one of: ${VALID_SECTIONS.join(', ')}`,
      });
    }

    this.logger.log(`regenerateSection: fetching kit id=${id}`);
    const kit = await this.getKitEntity(id, userId);
    const output = (kit.generatedOutput as Record<string, unknown>) ?? {};

    // We need the roleInput — reconstruct it from the kit's stored output + metadata
    const roleInput = {
      roleTitle: kit.roleTitle,
      department: kit.department,
      experienceLevel: kit.experienceLevel,
      workMode: kit.workMode,
      teamSize: kit.teamSize,
      // Pull skills/responsibilities from existing generatedOutput if available
      responsibilities: (output['jobDescription'] as any)?.responsibilities ?? [],
      requiredSkills: (output['rubric'] as any[])?.map((r: any) => r.skill) ?? [],
      niceToHaveSkills: [],
      focusAreas: (output['scorecard'] as any[])?.map((s: any) => s.competency) ?? [],
    };

    this.logger.log(`regenerateSection: calling AI service for section=${section}`);
    const sectionData = await this.aiService.regenerateSection(section, roleInput, id);
    this.logger.log(`regenerateSection: AI returned, updating DB for section=${section}`);
    const outputKey = SECTION_OUTPUT_KEY[section as SectionKey];

    const updatedOutput = { ...output, [outputKey]: sectionData };

    const updated = await this.prisma.interviewKit.update({
      where: { id },
      data: { generatedOutput: updatedOutput as unknown as Prisma.InputJsonValue },
    });
    this.logger.log(`regenerateSection: DB updated, returning response for section=${section}`);

    return { section, data: sectionData, kit: this.mapKit(updated) };
  }

  /** Generate or retrieve a shareable public token for a kit. */
  async getShareToken(id: string, userId: string) {
    const kit = await this.getKitEntity(id, userId);

    if ((kit as any).shareToken) {
      return { shareToken: (kit as any).shareToken };
    }

    const shareToken = randomBytes(16).toString('hex');
    await this.prisma.interviewKit.update({
      where: { id },
      data: { shareToken } as any,
    });

    return { shareToken };
  }

  /** Public access — no auth required. Returns kit by share token. */
  async findByShareToken(shareToken: string) {
    const kit = await this.prisma.interviewKit.findFirst({
      where: { shareToken, deletedAt: null } as any,
    });

    if (!kit) throw new NotFoundException({ error: 'KIT_NOT_FOUND', message: 'Shared kit not found or link has expired' });
    return this.mapKit(kit);
  }

  async remove(id: string, userId: string) {
    await this.findById(id, userId);
    await this.prisma.interviewKit.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async duplicate(id: string, userId: string) {
    const kit = await this.getKitEntity(id, userId);

    const copy = await this.prisma.interviewKit.create({
      data: {
        userId,
        roleTitle: `${kit.roleTitle} (copy)`,
        department: kit.department,
        experienceLevel: kit.experienceLevel,
        workMode: kit.workMode,
        teamSize: kit.teamSize ?? undefined,
        generatedOutput: kit.generatedOutput as Prisma.InputJsonValue ?? undefined,
        status: kit.status === 'generated' ? 'generated' : 'draft',
      },
    });

    return this.mapKit(copy);
  }

  async exportPdf(id: string, userId: string): Promise<string> {
    const kit = await this.getKitEntity(id, userId);
    const url = await this.aiService.exportPdf(id, kit.generatedOutput);
    await this.prisma.interviewKit.update({ where: { id }, data: { pdfUrl: url } });
    return url;
  }

  async exportDocx(id: string, userId: string): Promise<string> {
    const kit = await this.getKitEntity(id, userId);
    const url = await this.aiService.exportDocx(id, kit.generatedOutput);
    await this.prisma.interviewKit.update({ where: { id }, data: { docxUrl: url } });
    return url;
  }

  private mapKit(kit: {
    id: string;
    roleTitle: string;
    department: string;
    experienceLevel: string;
    workMode: string;
    teamSize: string | null;
    status: string;
    generatedOutput: unknown;
    pdfUrl: string | null;
    docxUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: unknown;
  }) {
    const output = (kit.generatedOutput ?? {}) as Record<string, unknown>;
    return {
      id: kit.id,
      roleTitle: kit.roleTitle,
      department: kit.department,
      experienceLevel: kit.experienceLevel,
      workMode: kit.workMode,
      teamSize: kit.teamSize,
      status: kit.status,
      pdfUrl: kit.pdfUrl,
      docxUrl: kit.docxUrl,
      shareToken: (kit as any).shareToken ?? null,
      createdAt: kit.createdAt.toISOString(),
      updatedAt: kit.updatedAt.toISOString(),
      jobDescription: output['jobDescription'] ?? null,
      behavioralQuestions: output['behavioralQuestions'] ?? [],
      technicalQuestions: output['technicalQuestions'] ?? [],
      scorecard: output['scorecard'] ?? [],
      rubric: output['rubric'] ?? [],
      languageIssues: output['languageIssues'] ?? [],
    };
  }
}
