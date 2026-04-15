import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InterviewKitService } from './interview-kit.service';
import { CreateInterviewKitDto } from './dto/create-interview-kit.dto';
import { UpdateScorecardDto } from './dto/update-interview-kit.dto';
import { QueryInterviewKitDto } from './dto/query-interview-kit.dto';

interface AuthRequest extends Request {
  user: { id: string; email: string; name: string; role: string };
}

/** AppModule registers named throttlers `global` and `generation`. Plain `@SkipThrottle()` only sets `default`, so it never skips those — polling endpoints must list both names. */
const SKIP_ALL_THROTTLERS = { global: true, generation: true } as const;

@ApiTags('interview-kit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interview-kit')
export class InterviewKitController {
  constructor(private readonly kitService: InterviewKitService) {}

  /** Generate a new kit — stricter rate limit: 20 per hour */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ generation: { ttl: 3_600_000, limit: 20 } })
  @ApiOperation({ summary: 'Generate a new interview kit via AI' })
  generate(@Body() dto: CreateInterviewKitDto, @Request() req: AuthRequest) {
    return this.kitService.generate(dto, req.user.id);
  }

  /**
   * SSE streaming generation — same rate limit as generate.
   * Emits: created | progress | complete | error
   * Use fetch() with a ReadableStream reader on the client (EventSource does not support POST).
   */
  @Post('generate-stream')
  @Throttle({ generation: { ttl: 3_600_000, limit: 20 } })
  @ApiOperation({ summary: 'Generate a kit with real-time SSE progress (streaming)' })
  async generateStream(
    @Body() dto: CreateInterviewKitDto,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    await this.kitService.generateStream(dto, req.user.id, res);
  }

  @Get()
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  @ApiOperation({ summary: 'List all interview kits for the authenticated user' })
  findAll(@Query() query: QueryInterviewKitDto, @Request() req: AuthRequest) {
    return this.kitService.findAll(req.user.id, query);
  }

  @Get(':id')
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  @ApiOperation({ summary: 'Get a single interview kit by ID' })
  findById(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.kitService.findById(id, req.user.id);
  }

  @Get(':id/status')
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  @ApiOperation({ summary: 'Poll generation status for a kit' })
  getStatus(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.kitService.getStatus(id, req.user.id);
  }

  /** Inline edit — update one or more sections of the generated output */
  @Patch(':id')
  @ApiOperation({ summary: 'Inline-edit sections of a generated kit' })
  updateKit(
    @Param('id') id: string,
    @Body() updates: Record<string, unknown>,
    @Request() req: AuthRequest,
  ) {
    return this.kitService.updateKit(id, req.user.id, updates);
  }

  @Put(':id/scorecard')
  @ApiOperation({ summary: 'Save updated scorecard scores' })
  updateScorecard(
    @Param('id') id: string,
    @Body() dto: UpdateScorecardDto,
    @Request() req: AuthRequest,
  ) {
    return this.kitService.updateScorecard(id, req.user.id, dto);
  }

  /** Regenerate a single section — rate limited to 20/hour shared with generate */
  @Post(':id/regenerate/:section')
  @HttpCode(HttpStatus.OK)
  @Throttle({ generation: { ttl: 3_600_000, limit: 20 } })
  @ApiOperation({ summary: 'Regenerate a single section of the kit' })
  regenerateSection(
    @Param('id') id: string,
    @Param('section') section: string,
    @Request() req: AuthRequest,
  ) {
    return this.kitService.regenerateSection(id, req.user.id, section);
  }

  /** Get or create a shareable public link token */
  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a shareable public link token for this kit' })
  getShareToken(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.kitService.getShareToken(id, req.user.id);
  }

  /** Export kit to PDF */
  @Post(':id/export/pdf')
  @HttpCode(HttpStatus.OK)
  @Throttle({ generation: { ttl: 3_600_000, limit: 20 } })
  @ApiOperation({ summary: 'Export kit to PDF' })
  exportPdf(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.kitService.exportPdf(id, req.user.id).then((url) => ({ url }));
  }

  /** Export kit to DOCX */
  @Post(':id/export/docx')
  @HttpCode(HttpStatus.OK)
  @Throttle({ generation: { ttl: 3_600_000, limit: 20 } })
  @ApiOperation({ summary: 'Export kit to DOCX (Word document)' })
  exportDocx(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.kitService.exportDocx(id, req.user.id).then((url) => ({ url }));
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate an existing kit' })
  duplicate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.kitService.duplicate(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an interview kit' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.kitService.remove(id, req.user.id);
  }
}

/** Public controller — no auth required */
@ApiTags('public')
@SkipThrottle(SKIP_ALL_THROTTLERS)
@Controller('public')
export class PublicKitController {
  constructor(private readonly kitService: InterviewKitService) {}

  @Get('kit/:token')
  @ApiOperation({ summary: 'Access a shared kit by public token (no auth required)' })
  getSharedKit(@Param('token') token: string) {
    return this.kitService.findByShareToken(token);
  }
}
