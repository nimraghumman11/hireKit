import { Controller, Post, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExportService } from './export.service';

interface AuthRequest extends Request {
  user: { id: string };
}

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interview-kit')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post(':id/export/pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export interview kit as PDF' })
  exportPdf(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.exportService.exportPdf(id, req.user.id);
  }
}
