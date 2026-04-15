import { PrismaService } from '../prisma/prisma.service';
interface CreateUserInput {
    name: string;
    email: string;
    password: string;
}
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: CreateUserInput): Promise<{
        id: string;
        name: string;
        email: string;
        password: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
export {};
