import { InterviewKitService } from './interview-kit.service';
import { CreateInterviewKitDto } from './dto/create-interview-kit.dto';
import { UpdateScorecardDto } from './dto/update-interview-kit.dto';
import { QueryInterviewKitDto } from './dto/query-interview-kit.dto';
interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}
export declare class InterviewKitController {
    private readonly kitService;
    constructor(kitService: InterviewKitService);
    generate(dto: CreateInterviewKitDto, req: AuthRequest): Promise<{
        id: string;
        roleTitle: string;
        department: string;
        experienceLevel: string;
        workMode: string;
        teamSize: string | null;
        status: string;
        pdfUrl: string | null;
        docxUrl: string | null;
        shareToken: any;
        createdAt: string;
        updatedAt: string;
        jobDescription: {} | null;
        behavioralQuestions: {};
        technicalQuestions: {};
        scorecard: {};
        rubric: {};
        languageIssues: {};
    }>;
    findAll(query: QueryInterviewKitDto, req: AuthRequest): Promise<{
        items: {
            id: string;
            roleTitle: string;
            department: string;
            experienceLevel: string;
            workMode: string;
            teamSize: string | null;
            status: string;
            pdfUrl: string | null;
            docxUrl: string | null;
            shareToken: any;
            createdAt: string;
            updatedAt: string;
            jobDescription: {} | null;
            behavioralQuestions: {};
            technicalQuestions: {};
            scorecard: {};
            rubric: {};
            languageIssues: {};
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string, req: AuthRequest): Promise<{
        id: string;
        roleTitle: string;
        department: string;
        experienceLevel: string;
        workMode: string;
        teamSize: string | null;
        status: string;
        pdfUrl: string | null;
        docxUrl: string | null;
        shareToken: any;
        createdAt: string;
        updatedAt: string;
        jobDescription: {} | null;
        behavioralQuestions: {};
        technicalQuestions: {};
        scorecard: {};
        rubric: {};
        languageIssues: {};
    }>;
    getStatus(id: string, req: AuthRequest): Promise<{
        status: string;
    }>;
    updateKit(id: string, updates: Record<string, unknown>, req: AuthRequest): Promise<{
        id: string;
        roleTitle: string;
        department: string;
        experienceLevel: string;
        workMode: string;
        teamSize: string | null;
        status: string;
        pdfUrl: string | null;
        docxUrl: string | null;
        shareToken: any;
        createdAt: string;
        updatedAt: string;
        jobDescription: {} | null;
        behavioralQuestions: {};
        technicalQuestions: {};
        scorecard: {};
        rubric: {};
        languageIssues: {};
    }>;
    updateScorecard(id: string, dto: UpdateScorecardDto, req: AuthRequest): Promise<{
        id: string;
        roleTitle: string;
        department: string;
        experienceLevel: string;
        workMode: string;
        teamSize: string | null;
        status: string;
        pdfUrl: string | null;
        docxUrl: string | null;
        shareToken: any;
        createdAt: string;
        updatedAt: string;
        jobDescription: {} | null;
        behavioralQuestions: {};
        technicalQuestions: {};
        scorecard: {};
        rubric: {};
        languageIssues: {};
    }>;
    regenerateSection(id: string, section: string, req: AuthRequest): Promise<{
        section: string;
        data: any;
        kit: {
            id: string;
            roleTitle: string;
            department: string;
            experienceLevel: string;
            workMode: string;
            teamSize: string | null;
            status: string;
            pdfUrl: string | null;
            docxUrl: string | null;
            shareToken: any;
            createdAt: string;
            updatedAt: string;
            jobDescription: {} | null;
            behavioralQuestions: {};
            technicalQuestions: {};
            scorecard: {};
            rubric: {};
            languageIssues: {};
        };
    }>;
    getShareToken(id: string, req: AuthRequest): Promise<{
        shareToken: any;
    }>;
    exportPdf(id: string, req: AuthRequest): Promise<{
        url: string;
    }>;
    exportDocx(id: string, req: AuthRequest): Promise<{
        url: string;
    }>;
    duplicate(id: string, req: AuthRequest): Promise<{
        id: string;
        roleTitle: string;
        department: string;
        experienceLevel: string;
        workMode: string;
        teamSize: string | null;
        status: string;
        pdfUrl: string | null;
        docxUrl: string | null;
        shareToken: any;
        createdAt: string;
        updatedAt: string;
        jobDescription: {} | null;
        behavioralQuestions: {};
        technicalQuestions: {};
        scorecard: {};
        rubric: {};
        languageIssues: {};
    }>;
    remove(id: string, req: AuthRequest): Promise<void>;
}
export declare class PublicKitController {
    private readonly kitService;
    constructor(kitService: InterviewKitService);
    getSharedKit(token: string): Promise<{
        id: string;
        roleTitle: string;
        department: string;
        experienceLevel: string;
        workMode: string;
        teamSize: string | null;
        status: string;
        pdfUrl: string | null;
        docxUrl: string | null;
        shareToken: any;
        createdAt: string;
        updatedAt: string;
        jobDescription: {} | null;
        behavioralQuestions: {};
        technicalQuestions: {};
        scorecard: {};
        rubric: {};
        languageIssues: {};
    }>;
}
export {};
