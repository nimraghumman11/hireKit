import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({ error: 'AUTH_EMAIL_TAKEN', message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({ name: dto.name, email: dto.email, password: hashed });

    const token = this.signToken(user.id, user.email, user.role);
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({ error: 'AUTH_INVALID', message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException({ error: 'AUTH_INVALID', message: 'Invalid email or password' });
    }

    const token = this.signToken(user.id, user.email, user.role);
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }

  private signToken(sub: string, email: string, role: string) {
    return this.jwtService.sign({ sub, email, role });
  }
}
