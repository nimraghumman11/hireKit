"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const interview_kit_service_1 = require("./interview-kit.service");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const generatedOutput = {
    roleTitle: 'Senior Engineer',
    department: 'Engineering',
    experienceLevel: 'senior',
    jobDescription: { summary: 'Test', responsibilities: [], requiredSkills: [], niceToHaveSkills: [], workMode: 'remote' },
    behavioralQuestions: [{ id: 'bq-1', question: 'Q', competency: 'C', evalCriteria: 'E', followUps: [], scoringGuide: { '1': 'a', '3': 'b', '5': 'c' } }],
    technicalQuestions: [],
    scorecard: [{ competency: 'Technical', weight: 1, score: 0, notes: '' }],
    rubric: [],
};
const kitRecord = {
    id: 'kit-1',
    userId: 'user-1',
    roleTitle: 'Senior Engineer',
    department: 'Engineering',
    experienceLevel: 'senior',
    workMode: 'remote',
    teamSize: null,
    status: 'generated',
    generatedOutput,
    pdfUrl: null,
    createdAt: new Date('2026-04-10T10:00:00Z'),
    updatedAt: new Date('2026-04-10T10:00:00Z'),
};
const mockPrisma = {
    interviewKit: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    aILog: { create: jest.fn() },
};
const mockAiService = { generateKit: jest.fn(), exportPdf: jest.fn() };
describe('InterviewKitService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                interview_kit_service_1.InterviewKitService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: ai_service_1.AiService, useValue: mockAiService },
            ],
        }).compile();
        service = module.get(interview_kit_service_1.InterviewKitService);
        jest.clearAllMocks();
    });
    describe('generate', () => {
        it('creates a kit with status "generating" and returns it immediately', async () => {
            mockPrisma.interviewKit.create.mockResolvedValue(kitRecord);
            mockAiService.generateKit.mockResolvedValue(generatedOutput);
            mockPrisma.interviewKit.update.mockResolvedValue({ ...kitRecord, status: 'generated' });
            mockPrisma.aILog.create.mockResolvedValue({});
            const result = await service.generate({
                description: 'We need a senior engineer for our platform team. They will lead API design, mentor juniors, and partner with product. Strong TypeScript and distributed systems experience required.',
            }, 'user-1');
            expect(result.id).toBe('kit-1');
            expect(mockPrisma.interviewKit.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'generating' }) }));
        });
    });
    describe('findById', () => {
        it('returns kit when user is owner', async () => {
            mockPrisma.interviewKit.findFirst.mockResolvedValue(kitRecord);
            const result = await service.findById('kit-1', 'user-1');
            expect(result.id).toBe('kit-1');
        });
        it('throws NotFoundException when kit not found', async () => {
            mockPrisma.interviewKit.findFirst.mockResolvedValue(null);
            await expect(service.findById('missing', 'user-1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('throws ForbiddenException when user is not owner', async () => {
            mockPrisma.interviewKit.findFirst.mockResolvedValue({ ...kitRecord, userId: 'other-user' });
            await expect(service.findById('kit-1', 'user-1')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('remove', () => {
        it('soft-deletes the kit', async () => {
            mockPrisma.interviewKit.findFirst.mockResolvedValue(kitRecord);
            mockPrisma.interviewKit.update.mockResolvedValue({});
            await service.remove('kit-1', 'user-1');
            expect(mockPrisma.interviewKit.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }));
        });
    });
});
//# sourceMappingURL=interview-kit.service.spec.js.map