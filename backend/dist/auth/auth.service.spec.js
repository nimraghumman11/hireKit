"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com', password: 'hashed', role: 'hiring_manager' };
const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
};
const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
};
describe('AuthService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: mockUsersService },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        jest.clearAllMocks();
    });
    describe('register', () => {
        it('creates user and returns token + user', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            mockUsersService.create.mockResolvedValue(mockUser);
            const result = await service.register({ name: 'Test', email: 'test@example.com', password: 'password123' });
            expect(result.token).toBe('mock-token');
            expect(result.user.email).toBe(mockUser.email);
            expect(result.user).not.toHaveProperty('password');
        });
        it('throws ConflictException when email already taken', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            await expect(service.register({ name: 'Test', email: 'test@example.com', password: 'pass' })).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('login', () => {
        it('returns token + user on valid credentials', async () => {
            const hashed = await bcrypt.hash('password123', 1);
            mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });
            const result = await service.login({ email: 'test@example.com', password: 'password123' });
            expect(result.token).toBe('mock-token');
            expect(result.user.email).toBe(mockUser.email);
        });
        it('throws UnauthorizedException for unknown email', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            await expect(service.login({ email: 'x@y.com', password: 'pass' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('throws UnauthorizedException for wrong password', async () => {
            const hashed = await bcrypt.hash('correct-pass', 1);
            mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });
            await expect(service.login({ email: 'test@example.com', password: 'wrong-pass' })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map