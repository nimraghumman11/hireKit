import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

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
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
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
      await expect(
        service.register({ name: 'Test', email: 'test@example.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
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
      await expect(service.login({ email: 'x@y.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correct-pass', 1);
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });
      await expect(service.login({ email: 'test@example.com', password: 'wrong-pass' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
