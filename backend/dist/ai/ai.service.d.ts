import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { CreateInterviewKitDto } from '../interview-kit/dto/create-interview-kit.dto';
export declare class AiService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly TIMEOUT_MS;
    constructor(httpService: HttpService, configService: ConfigService);
    generateKit(dto: CreateInterviewKitDto): Promise<{
        roleTitle: string;
        department: string;
        experienceLevel: string;
        jobDescription: {
            summary: string;
            requiredQualifications: string[];
            preferredQualifications: string[];
            responsibilities: string[];
            requiredSkills: string[];
            niceToHaveSkills: string[];
            workMode: string;
            aboutTheRole?: string | null | undefined;
            whyJoinUs?: string | null | undefined;
            whatYoullBring?: string | null | undefined;
            compensationAndBenefits?: string | null | undefined;
            salaryRange?: string | null | undefined;
        };
        behavioralQuestions: {
            id: string;
            question: string;
            competency: string;
            evalCriteria: string;
            followUps: string[];
            scoringGuide: {
                '1': string;
                '3': string;
                '5': string;
            };
        }[];
        technicalQuestions: {
            id: string;
            question: string;
            evalCriteria: string;
            difficulty: "easy" | "medium" | "hard";
            topic: string;
            sampleAnswer: string;
            redFlags: string[];
        }[];
        scorecard: {
            competency: string;
            weight: number;
            score?: number | null | undefined;
            notes?: string | null | undefined;
        }[];
        rubric: {
            skill: string;
            proficiencyLevels: {
                novice: string;
                intermediate: string;
                advanced: string;
                expert: string;
            };
        }[];
        languageIssues: {
            term: string;
            suggestion: string;
            severity: "error" | "warning";
            source: "jobDescription" | "behavioralQuestions" | "technicalQuestions" | "rubric";
        }[];
    }>;
    regenerateSection(section: string, roleInput: Record<string, unknown>, kitId: string): Promise<any>;
    exportPdf(kitId: string, kitData: unknown): Promise<string>;
    exportDocx(kitId: string, kitData: unknown): Promise<string>;
}
