"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InterviewKitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewKitService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const query_interview_kit_dto_1 = require("./dto/query-interview-kit.dto");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const VALID_SECTIONS = [
    'job-description',
    'behavioral-questions',
    'technical-questions',
    'scorecard',
    'rubric',
];
const SECTION_OUTPUT_KEY = {
    'job-description': 'jobDescription',
    'behavioral-questions': 'behavioralQuestions',
    'technical-questions': 'technicalQuestions',
    'scorecard': 'scorecard',
    'rubric': 'rubric',
};
let InterviewKitService = InterviewKitService_1 = class InterviewKitService {
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.logger = new common_1.Logger(InterviewKitService_1.name);
    }
    async generate(dto, userId) {
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
        this.runGeneration(kit.id, userId, dto).catch(async (err) => {
            this.logger.error(`Kit generation failed kitId=${kit.id}`, err);
            await this.prisma.interviewKit.update({
                where: { id: kit.id },
                data: { status: 'failed' },
            });
        });
        return this.mapKit(kit);
    }
    async runGeneration(kitId, userId, dto) {
        const start = Date.now();
        let responsePayload = null;
        try {
            const generatedOutput = await this.aiService.generateKit(dto);
            responsePayload = generatedOutput;
            const output = generatedOutput;
            await this.prisma.interviewKit.update({
                where: { id: kitId },
                data: {
                    generatedOutput: generatedOutput,
                    status: 'generated',
                    roleTitle: output['roleTitle'] || 'Untitled Role',
                    department: output['department'] || 'General',
                    experienceLevel: output['experienceLevel'] || 'mid',
                },
            });
            await this.prisma.aILog.create({
                data: {
                    kitId,
                    userId,
                    requestPayload: dto,
                    responsePayload: responsePayload,
                    status: 'success',
                    durationMs: Date.now() - start,
                },
            });
        }
        catch (err) {
            await this.prisma.aILog.create({
                data: {
                    kitId,
                    userId,
                    requestPayload: dto,
                    responsePayload: client_1.Prisma.DbNull,
                    status: 'failed',
                    durationMs: Date.now() - start,
                },
            });
            throw err;
        }
    }
    async findAll(userId, query) {
        const { page = 1, limit = 12, search, department, level, sort } = query;
        const where = {
            userId,
            deletedAt: null,
            ...(search && { roleTitle: { contains: search, mode: 'insensitive' } }),
            ...(department && { department }),
            ...(level && { experienceLevel: level }),
        };
        const orderBy = sort === query_interview_kit_dto_1.SortOrder.OLDEST
            ? { createdAt: 'asc' }
            : sort === query_interview_kit_dto_1.SortOrder.TITLE
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
    async findById(id, userId) {
        const kit = await this.getKitEntity(id, userId);
        return this.mapKit(kit);
    }
    async getKitEntity(id, userId) {
        const kit = await this.prisma.interviewKit.findFirst({ where: { id, deletedAt: null } });
        if (!kit)
            throw new common_1.NotFoundException({ error: 'KIT_NOT_FOUND', message: 'Interview kit not found' });
        if (kit.userId !== userId)
            throw new common_1.ForbiddenException({ error: 'KIT_FORBIDDEN', message: 'Access denied' });
        return kit;
    }
    async getStatus(id, userId) {
        const kit = await this.findById(id, userId);
        return { status: kit.status };
    }
    async updateKit(id, userId, updates) {
        const existing = await this.getKitEntity(id, userId);
        const currentOutput = existing.generatedOutput ?? {};
        const allowedKeys = ['jobDescription', 'behavioralQuestions', 'technicalQuestions', 'scorecard', 'rubric'];
        const sanitized = Object.fromEntries(Object.entries(updates).filter(([k]) => allowedKeys.includes(k)));
        const updatedOutput = { ...currentOutput, ...sanitized };
        const updated = await this.prisma.interviewKit.update({
            where: { id },
            data: { generatedOutput: updatedOutput },
        });
        return this.mapKit(updated);
    }
    async updateScorecard(id, userId, dto) {
        const existing = await this.getKitEntity(id, userId);
        const updatedOutput = {
            ...(existing.generatedOutput ?? {}),
            scorecard: dto.scorecard,
        };
        const updated = await this.prisma.interviewKit.update({
            where: { id },
            data: { generatedOutput: updatedOutput },
        });
        return this.mapKit(updated);
    }
    async regenerateSection(id, userId, section) {
        if (!VALID_SECTIONS.includes(section)) {
            throw new common_1.BadRequestException({
                error: 'INVALID_SECTION',
                message: `Section must be one of: ${VALID_SECTIONS.join(', ')}`,
            });
        }
        const kit = await this.getKitEntity(id, userId);
        const output = kit.generatedOutput ?? {};
        const roleInput = {
            roleTitle: kit.roleTitle,
            department: kit.department,
            experienceLevel: kit.experienceLevel,
            workMode: kit.workMode,
            teamSize: kit.teamSize,
            responsibilities: output['jobDescription']?.responsibilities ?? [],
            requiredSkills: output['rubric']?.map((r) => r.skill) ?? [],
            niceToHaveSkills: [],
            focusAreas: output['scorecard']?.map((s) => s.competency) ?? [],
        };
        const sectionData = await this.aiService.regenerateSection(section, roleInput, id);
        const outputKey = SECTION_OUTPUT_KEY[section];
        const updatedOutput = { ...output, [outputKey]: sectionData };
        const updated = await this.prisma.interviewKit.update({
            where: { id },
            data: { generatedOutput: updatedOutput },
        });
        return { section, data: sectionData, kit: this.mapKit(updated) };
    }
    async getShareToken(id, userId) {
        const kit = await this.getKitEntity(id, userId);
        if (kit.shareToken) {
            return { shareToken: kit.shareToken };
        }
        const shareToken = (0, crypto_1.randomBytes)(16).toString('hex');
        await this.prisma.interviewKit.update({
            where: { id },
            data: { shareToken },
        });
        return { shareToken };
    }
    async findByShareToken(shareToken) {
        const kit = await this.prisma.interviewKit.findFirst({
            where: { shareToken, deletedAt: null },
        });
        if (!kit)
            throw new common_1.NotFoundException({ error: 'KIT_NOT_FOUND', message: 'Shared kit not found or link has expired' });
        return this.mapKit(kit);
    }
    async remove(id, userId) {
        await this.findById(id, userId);
        await this.prisma.interviewKit.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async duplicate(id, userId) {
        const kit = await this.getKitEntity(id, userId);
        const copy = await this.prisma.interviewKit.create({
            data: {
                userId,
                roleTitle: `${kit.roleTitle} (copy)`,
                department: kit.department,
                experienceLevel: kit.experienceLevel,
                workMode: kit.workMode,
                teamSize: kit.teamSize ?? undefined,
                generatedOutput: kit.generatedOutput ?? undefined,
                status: kit.status === 'generated' ? 'generated' : 'draft',
            },
        });
        return this.mapKit(copy);
    }
    async exportPdf(id, userId) {
        const kit = await this.getKitEntity(id, userId);
        const url = await this.aiService.exportPdf(id, kit.generatedOutput);
        await this.prisma.interviewKit.update({ where: { id }, data: { pdfUrl: url } });
        return url;
    }
    async exportDocx(id, userId) {
        const kit = await this.getKitEntity(id, userId);
        const url = await this.aiService.exportDocx(id, kit.generatedOutput);
        await this.prisma.interviewKit.update({ where: { id }, data: { docxUrl: url } });
        return url;
    }
    mapKit(kit) {
        const output = (kit.generatedOutput ?? {});
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
            shareToken: kit.shareToken ?? null,
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
};
exports.InterviewKitService = InterviewKitService;
exports.InterviewKitService = InterviewKitService = InterviewKitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], InterviewKitService);
//# sourceMappingURL=interview-kit.service.js.map