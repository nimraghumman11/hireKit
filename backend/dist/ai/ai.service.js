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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const zod_1 = require("zod");
const jobDescriptionSchema = zod_1.z.object({
    summary: zod_1.z.string().default(''),
    aboutTheRole: zod_1.z.string().nullish(),
    whyJoinUs: zod_1.z.string().nullish(),
    requiredQualifications: zod_1.z.array(zod_1.z.string()).default([]),
    preferredQualifications: zod_1.z.array(zod_1.z.string()).default([]),
    whatYoullBring: zod_1.z.string().nullish(),
    compensationAndBenefits: zod_1.z.string().nullish(),
    responsibilities: zod_1.z.array(zod_1.z.string()).default([]),
    requiredSkills: zod_1.z.array(zod_1.z.string()).default([]),
    niceToHaveSkills: zod_1.z.array(zod_1.z.string()).default([]),
    workMode: zod_1.z.string().default('remote'),
    salaryRange: zod_1.z.string().nullish(),
});
const kitSchema = zod_1.z.object({
    roleTitle: zod_1.z.string(),
    department: zod_1.z.string(),
    experienceLevel: zod_1.z.string(),
    jobDescription: jobDescriptionSchema,
    behavioralQuestions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        question: zod_1.z.string(),
        competency: zod_1.z.string(),
        evalCriteria: zod_1.z.string(),
        followUps: zod_1.z.array(zod_1.z.string()),
        scoringGuide: zod_1.z.object({ '1': zod_1.z.string(), '3': zod_1.z.string(), '5': zod_1.z.string() }),
    })),
    technicalQuestions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        question: zod_1.z.string(),
        difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
        topic: zod_1.z.string(),
        evalCriteria: zod_1.z.string(),
        sampleAnswer: zod_1.z.string(),
        redFlags: zod_1.z.array(zod_1.z.string()),
    })),
    scorecard: zod_1.z.array(zod_1.z.object({
        competency: zod_1.z.string(),
        weight: zod_1.z.number(),
        score: zod_1.z.number().nullish(),
        notes: zod_1.z.string().nullish(),
    })),
    rubric: zod_1.z.array(zod_1.z.object({
        skill: zod_1.z.string(),
        proficiencyLevels: zod_1.z.object({
            novice: zod_1.z.string(),
            intermediate: zod_1.z.string(),
            advanced: zod_1.z.string(),
            expert: zod_1.z.string(),
        }),
    })),
    languageIssues: zod_1.z.array(zod_1.z.object({
        term: zod_1.z.string(),
        suggestion: zod_1.z.string(),
        severity: zod_1.z.enum(['warning', 'error']),
        source: zod_1.z.enum(['jobDescription', 'behavioralQuestions', 'technicalQuestions', 'rubric']),
    })).default([]),
});
let AiService = AiService_1 = class AiService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.TIMEOUT_MS = 300_000;
        this.baseUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8000');
    }
    async generateKit(dto) {
        this.logger.log('Generating kit from plain description');
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/generate-kit`, { description: dto.description }).pipe((0, rxjs_1.timeout)(this.TIMEOUT_MS), (0, rxjs_1.catchError)((err) => {
            const isTimeout = err.name === 'TimeoutError' || err.code === 'ECONNABORTED';
            if (isTimeout) {
                throw new common_1.ServiceUnavailableException({
                    error: 'AI_TIMEOUT',
                    message: 'AI service did not respond in time',
                });
            }
            if (err.response?.status >= 500) {
                throw new common_1.ServiceUnavailableException({
                    error: 'AI_UNAVAILABLE',
                    message: 'AI service is temporarily unavailable',
                });
            }
            throw err;
        })));
        const parsed = kitSchema.safeParse(response.data);
        if (!parsed.success) {
            this.logger.error('AI returned invalid schema', parsed.error.format());
            throw new common_1.UnprocessableEntityException({
                error: 'AI_INVALID_SCHEMA',
                message: 'AI returned a response that does not match the expected schema',
            });
        }
        return parsed.data;
    }
    async regenerateSection(section, roleInput, kitId) {
        this.logger.log(`Regenerating section=${section} for kitId=${kitId}`);
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService
            .post(`${this.baseUrl}/regenerate/${section}`, { kitId, roleInput })
            .pipe((0, rxjs_1.timeout)(120_000), (0, rxjs_1.catchError)((err) => {
            throw new common_1.ServiceUnavailableException({
                error: 'REGEN_FAILED',
                message: `Failed to regenerate ${section}`,
            });
        })));
        return response.data;
    }
    async exportPdf(kitId, kitData) {
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/export/pdf`, { kitId, kitData }).pipe((0, rxjs_1.timeout)(60_000), (0, rxjs_1.catchError)(() => {
            throw new common_1.ServiceUnavailableException({
                error: 'EXPORT_FAILED',
                message: 'PDF generation failed',
            });
        })));
        return response.data.url;
    }
    async exportDocx(kitId, kitData) {
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/export/docx`, { kitId, kitData }).pipe((0, rxjs_1.timeout)(60_000), (0, rxjs_1.catchError)(() => {
            throw new common_1.ServiceUnavailableException({
                error: 'EXPORT_FAILED',
                message: 'DOCX generation failed',
            });
        })));
        return response.data.url;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map